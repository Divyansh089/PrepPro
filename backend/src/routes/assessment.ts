import express from 'express';
import { 
  getAssessmentTracks, 
  generateAssessmentSession, 
  getAssessmentSession, 
  submitAssessmentSession, 
  getAssessmentHistory 
} from '../controllers/assessmentController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/tracks', authMiddleware, getAssessmentTracks);
router.post('/generate', authMiddleware, generateAssessmentSession);
router.get('/sessions/:sessionId', authMiddleware, getAssessmentSession);
router.post('/sessions/:sessionId/submit', authMiddleware, submitAssessmentSession);
router.get('/history', authMiddleware, getAssessmentHistory);

export default router;
