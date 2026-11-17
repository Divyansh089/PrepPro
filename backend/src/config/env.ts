import dotenv from 'dotenv';

dotenv.config();

// The server should not start without these
const requiredVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];

for (const name of requiredVars) {
  if (!process.env[name]) {
    console.error(`Missing required env variable: ${name}`);
    process.exit(1);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL as string,
  redisUrl: process.env.REDIS_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  judge0Url: process.env.JUDGE0_URL || '',
  judge0ApiKey: process.env.JUDGE0_API_KEY || '',
};
