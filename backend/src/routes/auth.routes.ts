import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema } from '../validators/auth.validator';
import { signup, login, getMe } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', auth, getMe);

export default router;
