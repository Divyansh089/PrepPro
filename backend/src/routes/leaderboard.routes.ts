import { Router } from 'express';
import { auth } from '../middleware/auth';
import { getLeaderboard } from '../controllers/leaderboard.controller';

const router = Router();

router.use(auth);

router.get('/', getLeaderboard);

export default router;
