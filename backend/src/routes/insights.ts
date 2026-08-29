import express from 'express';
import { getInsightsOverview } from '../controllers/insightsController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/overview', authMiddleware, getInsightsOverview);

export default router;
