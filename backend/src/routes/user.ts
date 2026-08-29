import express from 'express';
import { updateUserProfile, updateUserStats, getUserById } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.patch('/update', authMiddleware, updateUserProfile);
router.patch('/stats', authMiddleware, updateUserStats);
router.get('/:id', authMiddleware, getUserById);

export default router;
