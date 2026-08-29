import { Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { 
  InterviewSession, 
  Question, 
  Message, 
  UserProfile,
  CreateInterviewSessionRequest,
  SubmitAnswerRequest,
  QuestionEvaluationDoc
} from '../models/Interview';
import { ScoringService } from '../services/scoring';
import { GeminiAIService } from '../services/geminiAI';
import { CodeExecutionService } from '../services/codeExecution';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

let geminiAI: GeminiAIService | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    geminiAI = new GeminiAIService();
    console.log('✅ Gemini AI service initialized successfully');
  } else {
    console.warn('⚠️ GEMINI_API_KEY not found. AI features will be disabled.');
  }
} catch (error) {
  console.warn('⚠️ Gemini AI not available:', error);
}

const codeExecutionService = new CodeExecutionService();

async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      if (onTimeout) try { onTimeout(); } catch {}
      reject(new Error('AI generation timeout'));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle));
}

// User Profile Save / Get
export const saveProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const body = req.body;
    const db = await getDatabase();

    const roleInput = (body.role || 'swe').toLowerCase();
    const validRole = ['swe', 'senior-swe', 'frontend', 'backend', 'fullstack', 'devops', 'ml-engineer'].includes(roleInput)
      ? roleInput as UserProfile['role']
      : 'swe';

    const expInput = (body.experienceLevel || 'fresher').toLowerCase();
    const validExp = ['fresher', 'mid-level', 'senior'].includes(expInput)
      ? expInput as UserProfile['experienceLevel']
      : 'fresher';

    const langInput = (body.preferredLanguage || 'javascript').toLowerCase();
    const validLang = ['java', 'python', 'javascript', 'c++', 'c#', 'go', 'rust'].includes(langInput)
      ? langInput as UserProfile['preferredLanguage']
      : 'javascript';

    const typeInput = (body.interviewType || 'technical').toLowerCase();
    const validInterviewType = ['technical', 'system-design', 'behavioral', 'mixed'].includes(typeInput)
      ? typeInput as UserProfile['interviewType']
      : 'technical';

    const profile: UserProfile = {
      userId,
      role: validRole,
      experienceLevel: validExp,
      targetCompany: body.targetCompany,
      preferredLanguage: validLang,
      interviewType: validInterviewType,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('user_profiles').updateOne(
      { userId },
      { $set: profile },
      { upsert: true }
    );

    res.status(200).json({ message: 'Profile saved successfully', profile });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const db = await getDatabase();
    const profile = await db.collection<UserProfile>('user_profiles').findOne({ userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Create Session
export const createSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { profile, questionCount = 5 }: CreateInterviewSessionRequest = req.body;
    const db = await getDatabase();

    let sessionQuestions: Question[] = [];

    if (geminiAI) {
      try {
        const structuredQuestions = await withTimeout(
          geminiAI.generateStructuredQuestions({
            role: profile.role || 'Software Engineer',
            interviewType: (profile.interviewType as any) || 'technical',
            difficulty: (profile.experienceLevel === 'senior' ? 'hard' : profile.experienceLevel === 'fresher' ? 'easy' : 'medium'),
            count: questionCount,
            company: profile.targetCompany
          }),
          15000
        );
        sessionQuestions = structuredQuestions as any;
      } catch (err) {
        console.warn('⚠️ Gemini AI question generation failed/timed out, falling back to db bank');
      }
    }

    if (!sessionQuestions || sessionQuestions.length === 0) {
      const diffFilter = profile.experienceLevel === 'fresher' ? 'easy' : profile.experienceLevel === 'senior' ? 'hard' : 'medium';
      const dbQuestions = await db.collection<Question>('questions')
        .find({ difficulty: diffFilter })
        .limit(questionCount)
        .toArray();

      sessionQuestions = dbQuestions;
    }

    const questionIds = sessionQuestions.map(q => q.id || String(q._id));
    const questionSnapshots = sessionQuestions.map(q => ({
      id: q.id || String(q._id),
      title: q.title || q.description.slice(0, 30),
      description: q.description,
      type: q.type || 'coding',
      difficulty: q.difficulty || 'medium',
      category: q.category,
      tags: q.tags,
      timeLimit: q.timeLimit
    }));

    const sessionDoc: Omit<InterviewSession, '_id'> = {
      userId,
      status: 'active',
      currentPhase: 'technical',
      questionIds,
      questionSnapshots,
      currentQuestionIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('interview_sessions').insertOne(sessionDoc as any);

    res.status(201).json({
      sessionId: result.insertedId.toString(),
      status: 'active',
      questionCount: questionIds.length,
      questions: questionSnapshots
    });
  } catch (error) {
    console.error('Error creating interview session:', error);
    res.status(500).json({ error: 'Failed to create interview session' });
  }
};

// Get Session
export const getSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    if (!ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const db = await getDatabase();
    const session = await db.collection<InterviewSession>('interview_sessions').findOne({
      _id: new ObjectId(sessionId),
      userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// Start Session
export const startSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    if (!ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const db = await getDatabase();
    const session = await db.collection<InterviewSession>('interview_sessions').findOne({
      _id: new ObjectId(sessionId),
      userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await db.collection('interview_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { status: 'active', startTime: new Date(), updatedAt: new Date() } }
    );

    const initialQuestion = session.questionSnapshots?.[0];
    let initialGreeting = `Hello! Welcome to your interview session. Let's get started.`;

    if (geminiAI && initialQuestion) {
      try {
        initialGreeting = await withTimeout(
          geminiAI.generateInterviewerResponse({
            question: initialQuestion.description,
            questionType: initialQuestion.type,
            difficulty: initialQuestion.difficulty,
            role: 'Software Engineer',
            conversationHistory: [],
            currentPhase: session.currentPhase
          }),
          10000
        );
      } catch (e) {
        console.warn('⚠️ Greeting generation timed out, using fallback');
      }
    }

    const greetingMessage: Omit<Message, '_id'> = {
      sessionId: new ObjectId(sessionId),
      role: 'interviewer',
      content: initialGreeting,
      timestamp: new Date(),
      questionId: initialQuestion?.id
    };

    await db.collection('messages').insertOne(greetingMessage as any);

    res.status(200).json({
      message: 'Session started',
      initialMessage: initialGreeting,
      question: initialQuestion
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
};

// Get Questions with Filters
export const getQuestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, difficulty, category, limit = 10 } = req.query as any;
    const db = await getDatabase();

    const query: any = {};
    if (role) query.roles = { $regex: role, $options: 'i' };
    if (difficulty) query.difficulty = String(difficulty).toLowerCase();
    if (category) query.category = category;

    const questions = await db.collection<Question>('questions')
      .find(query)
      .limit(Number(limit))
      .toArray();

    res.status(200).json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Submit Answer
export const submitAnswer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    if (!ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const { questionId, answer, code, language, timeSpent = 0, hintsUsed = 0 }: SubmitAnswerRequest = req.body;

    const db = await getDatabase();
    const session = await db.collection<InterviewSession>('interview_sessions').findOne({
      _id: new ObjectId(sessionId),
      userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const currentQuestionSnapshot = session.questionSnapshots?.find(q => q.id === questionId) || session.questionSnapshots?.[session.currentQuestionIndex];

    const candidateMsg: Omit<Message, '_id'> = {
      sessionId: new ObjectId(sessionId),
      role: 'candidate',
      content: answer,
      timestamp: new Date(),
      questionId
    };
    await db.collection('messages').insertOne(candidateMsg as any);

    let executionResult: any = null;
    if (code && language) {
      try {
        executionResult = await codeExecutionService.executeCode(code, language);
      } catch (err) {
        console.warn('Code execution warning:', err);
      }
    }

    const evaluation = ScoringService.evaluateQuestion(
      questionId,
      answer,
      code,
      language,
      executionResult,
      timeSpent,
      hintsUsed
    );

    const evalDoc: Omit<QuestionEvaluationDoc, '_id'> = {
      sessionId: new ObjectId(sessionId),
      questionId,
      scores: evaluation.scores,
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      timeSpent,
      hintsUsed,
      codeSubmitted: code,
      language,
      executionResult,
      createdAt: new Date()
    };
    await db.collection('question_evaluations').insertOne(evalDoc as any);

    const nextIndex = session.currentQuestionIndex + 1;
    const isLastQuestion = nextIndex >= (session.questionSnapshots?.length || 0);
    const nextQuestion = isLastQuestion ? null : session.questionSnapshots?.[nextIndex];

    let nextInterviewerMessage = isLastQuestion
      ? "Thank you! That completes all the questions for this interview session. Click 'Complete Session' to see your detailed score and feedback."
      : `Moving on to question ${nextIndex + 1}: ${nextQuestion?.description}`;

    if (geminiAI && nextQuestion) {
      try {
        nextInterviewerMessage = await withTimeout(
          geminiAI.generateInterviewerResponse({
            question: nextQuestion.description,
            questionType: nextQuestion.type,
            difficulty: nextQuestion.difficulty,
            role: 'Software Engineer',
            conversationHistory: [],
            currentPhase: session.currentPhase,
            candidateAnswer: answer
          }),
          10000
        );
      } catch (e) {
        console.warn('⚠️ Next question AI message timed out');
      }
    }

    const interviewerMsg: Omit<Message, '_id'> = {
      sessionId: new ObjectId(sessionId),
      role: 'interviewer',
      content: nextInterviewerMessage,
      timestamp: new Date(),
      questionId: nextQuestion?.id
    };
    await db.collection('messages').insertOne(interviewerMsg as any);

    await db.collection('interview_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      {
        $set: {
          currentQuestionIndex: nextIndex,
          status: isLastQuestion ? 'completed' : 'active',
          updatedAt: new Date()
        }
      }
    );

    res.status(200).json({
      evaluation,
      nextQuestion,
      interviewerMessage: nextInterviewerMessage,
      isCompleted: isLastQuestion
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// Get Session Messages
export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const db = await getDatabase();
    const messages = await db.collection<Message>('messages')
      .find({ sessionId: new ObjectId(sessionId) })
      .sort({ timestamp: 1 })
      .toArray();

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Complete Session
export const completeSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    if (!ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const db = await getDatabase();
    const session = await db.collection<InterviewSession>('interview_sessions').findOne({
      _id: new ObjectId(sessionId),
      userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const evaluationsDoc = await db.collection<QuestionEvaluationDoc>('question_evaluations')
      .find({ sessionId: new ObjectId(sessionId) })
      .toArray();

    const evaluations = evaluationsDoc.map(e => ({
      questionId: e.questionId,
      scores: e.scores,
      totalScore: e.totalScore,
      feedback: e.feedback,
      timeSpent: e.timeSpent,
      hintsUsed: e.hintsUsed
    }));

    const calculatedScore = ScoringService.calculateInterviewScore(evaluations);

    await db.collection('interview_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      {
        $set: {
          status: 'completed',
          score: calculatedScore,
          endTime: new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.status(200).json({
      sessionId,
      score: calculatedScore
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
};

// Get History
export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;

    const db = await getDatabase();
    const history = await db.collection<InterviewSession>('interview_sessions')
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await db.collection('interview_sessions').countDocuments({ userId });

    res.status(200).json({
      history,
      pagination: { total, limit, offset }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch interview history' });
  }
};

// Get Analytics
export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const db = await getDatabase();

    const sessions = await db.collection<InterviewSession>('interview_sessions')
      .find({ userId, status: 'completed' })
      .toArray();

    const totalSessions = sessions.length;
    const averageScore = totalSessions > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score?.overall || 0), 0) / totalSessions)
      : 0;

    res.status(200).json({
      totalSessions,
      averageScore,
      sessions
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Execute Code
export const executeCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, language, testCases } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    const result = await codeExecutionService.executeCode(code, language, testCases);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
};
