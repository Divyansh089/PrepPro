import express from 'express';
import { getDashboardSummary, getLeaderboard } from '../controllers/dashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/summary', authMiddleware, getDashboardSummary);
router.get('/leaderboard', authMiddleware, getLeaderboard);

export default router;
