import express from 'express';
import {
  saveProfile,
  getProfile,
  createSession,
  getSession,
  startSession,
  getQuestions,
  submitAnswer,
  getMessages,
  completeSession,
  getHistory,
  getAnalytics,
  executeCode
} from '../controllers/interviewController';
import { authMiddleware } from '../middlewares/authMiddleware';

import { validate } from '../middlewares/validateMiddleware';
import { createSessionSchema, sendMessageSchema } from '../validations/interviewValidation';

const router = express.Router();

router.post('/profile', authMiddleware, saveProfile);
router.get('/profile', authMiddleware, getProfile);

router.post('/sessions', authMiddleware, validate(createSessionSchema), createSession);
router.get('/sessions/:sessionId', authMiddleware, getSession);
router.post('/sessions/:sessionId/start', authMiddleware, startSession);

router.get('/questions', authMiddleware, getQuestions);
router.post('/sessions/:sessionId/answer', authMiddleware, submitAnswer);
router.get('/sessions/:sessionId/messages', authMiddleware, getMessages);
router.post('/sessions/:sessionId/complete', authMiddleware, completeSession);

router.get('/history', authMiddleware, getHistory);
router.get('/analytics', authMiddleware, getAnalytics);
router.post('/execute-code', authMiddleware, executeCode);

export default router;
