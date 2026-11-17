import Redis from 'ioredis';
import { env } from './env';

// One shared client for the whole app.
// If Redis is down, commands fail straight away instead of waiting,
// so the leaderboard can fall back to Postgres quickly.
export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

// Redis is only a cache, so we log errors instead of crashing
redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});
