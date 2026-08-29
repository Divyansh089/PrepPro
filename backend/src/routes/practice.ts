import express from 'express';
import { 
  getPracticeTopics, 
  generatePracticeSession, 
  getPracticeSession, 
  submitPracticeSession 
} from '../controllers/practiceController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/topics', authMiddleware, getPracticeTopics);
router.post('/generate', authMiddleware, generatePracticeSession);
router.get('/sessions/:sessionId', authMiddleware, getPracticeSession);
router.post('/sessions/:sessionId/submit', authMiddleware, submitPracticeSession);

export default router;
