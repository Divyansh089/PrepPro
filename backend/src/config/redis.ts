import Redis from 'ioredis';
import { env } from './env';

// One shared client for the whole app
export const redis = new Redis(env.redisUrl);

// Redis is only a cache, so we log errors instead of crashing
redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});
