import { redis } from '../config/redis';

const FIVE_MINUTES = 5 * 60;

// When Redis comes back after being down, the cache may hold stats from before tests
// that finished meanwhile (clearing it failed then). So we drop all cached stats.
redis.on('ready', async () => {
  try {
    const keys = [...(await redis.keys('dashboard:*')), ...(await redis.keys('insights:*'))];
    if (keys.length > 0) await redis.del(...keys);
  } catch (err: any) {
    console.error('Could not clear stats cache:', err.message);
  }
});

// Returns the cached value for `key`, or runs `load` and caches what it returns.
// If Redis is down, it just runs `load`, so the data still comes from Postgres.
export async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch (err: any) {
    console.error(`Cache read failed for ${key}:`, err.message);
  }

  const data = await load();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', FIVE_MINUTES);
  } catch (err: any) {
    console.error(`Cache write failed for ${key}:`, err.message);
  }

  return data;
}

// Call after a user finishes a test or an interview, so their stats are fresh
export async function clearUserStats(userId: string) {
  try {
    await redis.del(`dashboard:${userId}`, `insights:${userId}`);
  } catch (err: any) {
    console.error('Could not clear stats cache:', err.message);
  }
}
