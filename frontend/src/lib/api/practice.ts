import { graphqlRequest } from './base';

export type PracticeTopic = 'quant' | 'verbal' | 'aptitude' | 'reasoning' | 'games';
export type PracticeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type PracticeQuestion = {
  id: string;
  prompt: string;
  answerType: 'single-choice' | 'multiple-choice' | 'short-text';
  options?: string[];
  tags: string[];
  estimatedTime: number;
  order: number;
  difficulty: PracticeDifficulty;
};

export type PracticeSummary = {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  suggestions: string[];
};

export type PracticeResult = {
  questionId: string;
  prompt: string;
  answerType: PracticeQuestion['answerType'];
  options?: string[];
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  explanation: string;
  tags: string[];
  order: number;
};

export type PracticeEvaluation = {
  sessionId: string;
  accuracy: number;
  score: number;
  summary: PracticeSummary;
  results: PracticeResult[];
};

export const practiceApi = {
  getTopics: async () => {
    return {
      topics: [
        { id: 'quant' as PracticeTopic, name: 'Quantitative Aptitude', difficulties: ['beginner', 'intermediate', 'advanced'] as PracticeDifficulty[] },
        { id: 'verbal' as PracticeTopic, name: 'Verbal Ability', difficulties: ['beginner', 'intermediate', 'advanced'] as PracticeDifficulty[] },
        { id: 'aptitude' as PracticeTopic, name: 'Logical Reasoning', difficulties: ['beginner', 'intermediate', 'advanced'] as PracticeDifficulty[] },
      ],
    };
  },

  generateSession: async (payload: {
    topic: PracticeTopic;
    difficulty: PracticeDifficulty;
    count?: number;
  }) => {
    const data = await graphqlRequest(`
      mutation GeneratePractice($category: String, $difficulty: String, $count: Int) {
        generatePracticeSession(category: $category, difficulty: $difficulty, count: $count) {
          id
          questions {
            id
            title
            description
            difficulty
            category
          }
        }
      }
    `, { category: payload.topic, difficulty: payload.difficulty, count: payload.count || 5 });

    const session = data.generatePracticeSession;
    return {
      sessionId: session.id,
      topic: payload.topic,
      difficulty: payload.difficulty,
      status: 'active',
      questions: session.questions.map((q: any, idx: number) => ({
        id: q.id,
        prompt: q.description || q.title,
        answerType: 'single-choice' as const,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        tags: [q.category],
        estimatedTime: 60,
        order: idx + 1,
        difficulty: payload.difficulty,
      })),
    };
  },

  getSession: async (sessionId: string) => {
    return {
      sessionId,
      topic: 'quant' as PracticeTopic,
      difficulty: 'intermediate' as PracticeDifficulty,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q-1',
          prompt: 'What is the sum of angles in a triangle?',
          answerType: 'single-choice' as const,
          options: ['180°', '360°', '90°', '270°'],
          tags: ['Geometry'],
          estimatedTime: 60,
          order: 1,
          difficulty: 'beginner' as PracticeDifficulty,
        },
      ],
    };
  },

  submitSession: async (sessionId: string, answers: Array<{ questionId: string; answer: string | string[] }>) => {
    return {
      sessionId,
      accuracy: 100,
      score: 10,
      summary: {
        strengths: ['Great accuracy'],
        weaknesses: [],
        improvements: ['Solve faster'],
        suggestions: ['Practice advanced levels'],
      },
      results: [],
    };
  },
};
