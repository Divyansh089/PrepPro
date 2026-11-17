// env must be imported first so the .env file is loaded before anything else
import { env } from './config/env';
import { prisma } from './config/prisma';
import app from './app';

async function start() {
  await prisma.$connect();
  console.log('Connected to PostgreSQL');

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
