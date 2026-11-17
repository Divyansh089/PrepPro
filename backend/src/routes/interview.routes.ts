import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createInterviewSchema, sendMessageSchema, runCodeSchema } from '../validators/interview.validator';
import {
  createInterview,
  listInterviews,
  getInterview,
  sendMessage,
  runCode,
  endInterview,
} from '../controllers/interview.controller';

const router = Router();

router.use(auth);

router.post('/', validate(createInterviewSchema), createInterview);
router.get('/', listInterviews);
router.get('/:id', getInterview);
router.post('/:id/messages', validate(sendMessageSchema), sendMessage);
router.post('/:id/run-code', validate(runCodeSchema), runCode);
router.post('/:id/end', endInterview);

export default router;
