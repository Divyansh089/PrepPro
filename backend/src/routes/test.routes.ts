import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTestSchema, submitTestSchema } from '../validators/test.validator';
import { getCategories, createTest, listTests, getTest, submitTest } from '../controllers/test.controller';

const router = Router();

router.use(auth);

// /categories must come before /:id, otherwise "categories" is read as an id
router.get('/categories', getCategories);
router.post('/', validate(createTestSchema), createTest);
router.get('/', listTests);
router.get('/:id', getTest);
router.post('/:id/submit', validate(submitTestSchema), submitTest);

export default router;
