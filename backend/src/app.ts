import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({ origin: env.corsOrigin.split(',').map((origin) => origin.trim()) }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes (added in the next issues)
// app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

export default app;
