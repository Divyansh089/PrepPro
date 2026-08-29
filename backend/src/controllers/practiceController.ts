import { Response } from 'express';
import { PracticeService } from '../services/practiceService';
import { PracticeDifficulty, PracticeTopic } from '../models/Practice';
import { GeminiAIService } from '../services/geminiAI';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

let geminiAI: GeminiAIService | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    geminiAI = new GeminiAIService();
    console.log('✅ Gemini AI (practice) initialised');
  } else {
    console.warn('⚠️ GEMINI_API_KEY not found. Practice AI feedback will use heuristics.');
  }
} catch (error) {
  console.warn('⚠️ Unable to initialise Gemini AI for practice:', error);
}

const isValidTopic = (topic: any): topic is PracticeTopic =>
  ['quant', 'verbal', 'aptitude', 'reasoning', 'games'].includes(topic);

const isValidDifficulty = (difficulty: any): difficulty is PracticeDifficulty =>
  ['beginner', 'intermediate', 'advanced'].includes(difficulty);

export const getPracticeTopics = (_req: AuthenticatedRequest, res: Response) => {
  const data = PracticeService.listTopics();
  res.json(data);
};

export const generatePracticeSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, difficulty, count } = req.body || {};

    if (!isValidTopic(topic)) {
      return res.status(400).json({ error: 'Invalid practice topic.' });
    }

    if (!isValidDifficulty(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level.' });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { session, questionsForUser } = await PracticeService.createSession({
      userId,
      topic,
      difficulty,
      count: typeof count === 'number' ? count : 10,
      geminiAI
    });

    res.json({
      sessionId: session.sessionId,
      topic: session.topic,
      difficulty: session.difficulty,
      status: session.status,
      questions: questionsForUser
    });
  } catch (error: any) {
    console.error('Practice generation failed:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate practice questions.' });
  }
};

export const getPracticeSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await PracticeService.getSession({ userId, sessionId });
    res.json(session);
  } catch (error: any) {
    console.error('Failed to fetch practice session:', error);
    res.status(error?.message?.includes('not found') ? 404 : 500).json({ error: error?.message || 'Failed to fetch session.' });
  }
};

export const submitPracticeSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { answers } = req.body || {};

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be an array.' });
    }

    const evaluation = await PracticeService.submitSession({
      userId,
      sessionId,
      answers,
      geminiAI
    });

    res.json(evaluation);
  } catch (error: any) {
    console.error('Failed to submit practice session:', error);
    res.status(error?.message?.includes('not found') ? 404 : 500).json({ error: error?.message || 'Failed to submit practice session.' });
  }
};
