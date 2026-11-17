import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import testRoutes from './routes/test.routes';
import interviewRoutes from './routes/interview.routes';
import leaderboardRoutes from './routes/leaderboard.routes';

const app = express();

app.use(cors({ origin: env.corsOrigin.split(',').map((origin) => origin.trim()) }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

export default app;
