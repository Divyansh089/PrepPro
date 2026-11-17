// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';

import { testConnection } from './config/database';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// CORS setup
const rawOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean).map(o => o.replace(/\/$/, ''));

function originIsAllowed(origin: string | undefined) {
  if (!origin) return false;
  const norm = origin.replace(/\/$/, '');
  return rawOrigins.includes(norm);
}

const corsOptions: cors.CorsOptionsDelegate = (req, callback) => {
  const origin = (req as any).headers?.origin as string | undefined;
  if (!origin) {
    return callback(null, { origin: true, credentials: true, methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] });
  }
  if (originIsAllowed(origin)) {
    const norm = origin.replace(/\/$/, '');
    const matched = rawOrigins.find(o => o === norm) || norm;
    return callback(null, { origin: matched, credentials: true, methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] });
  }
  return callback(null, { origin: false });
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

async function startServer() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to MongoDB.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 PrepPro backend running on port ${PORT}`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
