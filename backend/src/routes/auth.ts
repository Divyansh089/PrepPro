import express from 'express';
import { signup, login, getMe, completeProfile, changePassword } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

import { validate } from '../middlewares/validateMiddleware';
import { registerSchema, loginSchema } from '../validations/authValidation';

const router = express.Router();

router.post('/signup', validate(registerSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', authMiddleware, getMe);
router.put('/complete-profile', authMiddleware, completeProfile);
router.put('/change-password', authMiddleware, changePassword);

export default router;
