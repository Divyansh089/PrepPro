import { prisma } from '../config/prisma';
import { redis } from '../config/redis';

// Redis sorted set: member = userId, score = total points.
// Postgres (User.totalPoints) is the source of truth, Redis is only a fast copy.
const KEY = 'leaderboard';

// Loads every user with points from Postgres into Redis
export async function rebuild() {
  const users = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    select: { id: true, totalPoints: true },
  });

  const multi = redis.multi().del(KEY);
  for (const user of users) {
    multi.zadd(KEY, user.totalPoints, user.id);
  }
  await multi.exec();

  console.log(`Leaderboard rebuilt with ${users.length} users`);
}

// On startup and after every reconnect, so points earned while Redis was down are not lost
redis.on('ready', () => {
  rebuild().catch((err) => console.error('Leaderboard rebuild failed:', err.message));
});

// Rebuilds the set if it is missing, e.g. after a Redis restart or FLUSHALL
async function ensureBuilt() {
  const exists = await redis.exists(KEY);
  if (!exists) {
    await rebuild();
  }
}

// Call this after the points are saved in Postgres
export async function addPoints(userId: string, points: number) {
  if (points <= 0) return;

  try {
    const exists = await redis.exists(KEY);
    if (exists) {
      await redis.zincrby(KEY, points, userId);
    } else {
      // A rebuild reads Postgres, which already has the new points
      await rebuild();
    }
  } catch (err: any) {
    // The leaderboard is rebuilt from Postgres later, so this is not fatal
    console.error('Could not update leaderboard in Redis:', err.message);
  }
}

// Top users from Redis, with names and avatars from Postgres in one query
async function getTop(limit: number) {
  const result = await redis.zrevrange(KEY, 0, limit - 1, 'WITHSCORES');

  // result is [id1, score1, id2, score2, ...]
  const entries: Array<{ id: string; points: number }> = [];
  for (let i = 0; i < result.length; i += 2) {
    entries.push({ id: result[i], points: Number(result[i + 1]) });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: entries.map((e) => e.id) } },
    select: { id: true, name: true, avatarUrl: true, college: true },
  });
  const usersById = new Map(users.map((u) => [u.id, u]));

  return entries
    .filter((e) => usersById.has(e.id)) // skips users that were deleted
    .map((e, index) => ({ rank: index + 1, ...usersById.get(e.id)!, points: e.points }));
}

async function getRank(userId: string) {
  const [rank, score] = await Promise.all([redis.zrevrank(KEY, userId), redis.zscore(KEY, userId)]);

  // Users with 0 points are not in the set, so they have no rank yet
  return {
    rank: rank === null ? null : rank + 1,
    points: score === null ? 0 : Number(score),
  };
}

async function getRankFromPostgres(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { totalPoints: true } });
  const points = me?.totalPoints ?? 0;
  if (points === 0) return { rank: null, points };

  const higher = await prisma.user.count({ where: { totalPoints: { gt: points } } });
  return { rank: higher + 1, points };
}

// Used when Redis is down: the same data, straight from Postgres
async function getLeaderboardFromPostgres(userId: string, limit: number) {
  const users = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    orderBy: { totalPoints: 'desc' },
    take: limit,
    select: { id: true, name: true, avatarUrl: true, college: true, totalPoints: true },
  });

  const top = users.map(({ totalPoints, ...user }, index) => ({ rank: index + 1, ...user, points: totalPoints }));
  return { top, me: await getRankFromPostgres(userId) };
}

// One user's rank, used by the dashboard
export async function getUserRank(userId: string) {
  try {
    await ensureBuilt();
    return await getRank(userId);
  } catch (err: any) {
    console.error('Redis rank failed, using Postgres:', err.message);
    return getRankFromPostgres(userId);
  }
}

// GET /api/leaderboard
export async function getLeaderboard(userId: string, limit: number) {
  try {
    await ensureBuilt();
    const [top, me] = await Promise.all([getTop(limit), getRank(userId)]);
    return { top, me };
  } catch (err: any) {
    console.error('Redis leaderboard failed, using Postgres:', err.message);
    return getLeaderboardFromPostgres(userId, limit);
  }
}
