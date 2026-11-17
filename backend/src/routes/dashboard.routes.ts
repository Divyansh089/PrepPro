import { Router } from 'express';
import { auth } from '../middleware/auth';
import { getDashboard, getInsights } from '../controllers/dashboard.controller';

const router = Router();

router.get('/dashboard', auth, getDashboard);
router.get('/insights', auth, getInsights);

export default router;
