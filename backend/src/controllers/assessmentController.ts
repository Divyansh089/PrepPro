import { Response } from 'express';
import { AssessmentService } from '../services/assessmentService';
import { AssessmentDifficulty, AssessmentTrack, AssessmentTopic } from '../models/Assessment';
import { GeminiAIService } from '../services/geminiAI';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

let geminiAI: GeminiAIService | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    geminiAI = new GeminiAIService();
    console.log('✅ Gemini AI (assessment) initialised');
  } else {
    console.warn('⚠️ GEMINI_API_KEY not found. Assessment AI generation will use fallback questions.');
  }
} catch (error) {
  console.warn('⚠️ Unable to initialise Gemini AI for assessments:', error);
}

const isValidTrack = (track: any): track is AssessmentTrack =>
  ['soft-skills', 'technical-skills'].includes(track);

const isValidTopic = (topic: any): topic is AssessmentTopic =>
  [
    'quant',
    'verbal',
    'aptitude',
    'coding',
    'cloud',
    'dbms',
    'operating-systems',
    'networks',
    'system-design'
  ].includes(topic);

const isValidDifficulty = (difficulty: any): difficulty is AssessmentDifficulty =>
  ['beginner', 'intermediate', 'advanced'].includes(difficulty);

export const getAssessmentTracks = (_req: AuthenticatedRequest, res: Response) => {
  const tracks = AssessmentService.getTracks();
  res.json({ tracks });
};

export const generateAssessmentSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { track, topic, difficulty, count } = req.body || {};

    if (!isValidTrack(track)) {
      return res.status(400).json({ error: 'Invalid assessment track.' });
    }

    if (!isValidTopic(topic)) {
      return res.status(400).json({ error: 'Invalid assessment topic.' });
    }

    if (!isValidDifficulty(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level.' });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { session, questionsForUser } = await AssessmentService.createSession({
      userId,
      track,
      topic,
      difficulty,
      count: typeof count === 'number' ? count : 12,
      geminiAI
    });

    res.json({
      sessionId: session.sessionId,
      track: session.track,
      topic: session.topic,
      difficulty: session.difficulty,
      status: session.status,
      questions: questionsForUser
    });
  } catch (error: any) {
    console.error('Assessment generation failed:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate assessment.' });
  }
};

export const getAssessmentSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await AssessmentService.getSession({ userId, sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Assessment session not found.' });
    }

    res.json(session);
  } catch (error: any) {
    console.error('Failed to fetch assessment session:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch assessment session.' });
  }
};

export const submitAssessmentSession = async (req: AuthenticatedRequest, res: Response) => {
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

    const evaluation = await AssessmentService.submitSession({
      userId,
      sessionId,
      answers,
      geminiAI
    });

    res.json(evaluation);
  } catch (error: any) {
    console.error('Failed to submit assessment session:', error);
    const status = error?.message?.includes('not found') ? 404 : 500;
    res.status(status).json({ error: error?.message || 'Failed to submit assessment session.' });
  }
};

export const getAssessmentHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const limitRaw = req.query.limit;
    const limit = typeof limitRaw === 'string' ? parseInt(limitRaw, 10) : undefined;

    const history = await AssessmentService.getHistory({ userId, limit: Number.isFinite(limit) ? limit : undefined });
    res.json({ history });
  } catch (error: any) {
    console.error('Failed to fetch assessment history:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch assessment history.' });
  }
};
