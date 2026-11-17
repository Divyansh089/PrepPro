import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../validators/user.validator';
import { updateProfile, changePassword, getUser } from '../controllers/user.controller';

const router = Router();

// Every user route needs a logged-in user
router.use(auth);

router.put('/me', validate(updateProfileSchema), updateProfile);
router.put('/me/password', validate(changePasswordSchema), changePassword);
router.get('/:id', getUser);

export default router;
