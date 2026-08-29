import express from 'express';
import { signup, login, getMe, completeProfile, changePassword } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/complete-profile', authMiddleware, completeProfile);
router.put('/change-password', authMiddleware, changePassword);

export default router;
