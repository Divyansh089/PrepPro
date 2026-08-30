import express from 'express';
import { updateUserProfile, updateUserStats, getUserById } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';

import { validate } from '../middlewares/validateMiddleware';
import { updateProfileSchema, updateStatsSchema } from '../validations/userValidation';

const router = express.Router();

router.patch('/update', authMiddleware, validate(updateProfileSchema), updateUserProfile);
router.patch('/stats', authMiddleware, validate(updateStatsSchema), updateUserStats);
router.get('/:id', authMiddleware, getUserById);

export default router;
