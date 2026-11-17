import { api } from './base';

export type TestMode = 'PRACTICE' | 'ASSESSMENT';
export type Category =
  | 'QUANT'
  | 'VERBAL'
  | 'APTITUDE'
  | 'REASONING'
  | 'CODING'
  | 'DBMS'
  | 'OS'
  | 'NETWORKS'
  | 'CLOUD'
  | 'SYSTEM_DESIGN';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SHORT_TEXT';

export type CategoryInfo = {
  id: Category;
  label: string;
  group: 'Aptitude' | 'Technical';
};

export type TestQuestion = {
  id: string;
  order: number;
  type: QuestionType;
  text: string;
  options: string[];
  // Only present after the test is submitted
  userAnswer?: string[];
  isCorrect?: boolean;
  correctAnswer?: string[];
  explanation?: string;
};

export type Feedback = {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

export type Test = {
  id: string;
  mode: TestMode;
  category: Category;
  difficulty: Difficulty;
  status: 'IN_PROGRESS' | 'COMPLETED';
  totalQuestions: number;
  correctCount: number;
  score: number;
  feedback: Feedback | null;
  startedAt: string;
  completedAt: string | null;
  questions: TestQuestion[];
};

export type TestSummary = Omit<Test, 'questions' | 'feedback'>;

export type TestList = {
  tests: TestSummary[];
  page: number;
  limit: number;
  total: number;
};

export const testsApi = {
  getCategories: () =>
    api.get<{ categories: CategoryInfo[]; difficulties: Difficulty[] }>('/tests/categories'),

  create: (data: { mode: TestMode; category: Category; difficulty: Difficulty; count: number }) =>
    api.post<Test>('/tests', data),

  list: (params: { mode?: TestMode; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.mode) query.set('mode', params.mode);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return api.get<TestList>(`/tests?${query.toString()}`);
  },

  get: (id: string) => api.get<Test>(`/tests/${id}`),

  submit: (id: string, answers: Array<{ questionId: string; answer: string[] }>) =>
    api.post<Test>(`/tests/${id}/submit`, { answers }),

  /**
   * @deprecated Old shape, only kept for the insights and leaderboard pages
   * until they are rewritten (dashboard/insights and leaderboard issues).
   */
  getHistory: async (limit = 20) => {
    const { tests } = await testsApi.list({ limit: Math.min(limit, 50) });
    return {
      history: tests
        .filter((t) => t.status === 'COMPLETED')
        .map((t) => ({
          sessionId: t.id,
          topic: t.category.toLowerCase(),
          difficulty: t.difficulty,
          score: t.score,
          accuracy: t.totalQuestions ? t.correctCount / t.totalQuestions : 0,
          createdAt: t.completedAt ?? t.startedAt,
        })),
    };
  },
};

// Shared display helpers
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  QUANT: 'Quantitative Aptitude',
  VERBAL: 'Verbal Ability',
  APTITUDE: 'Logical Aptitude',
  REASONING: 'Reasoning & Puzzles',
  CODING: 'Coding & DSA',
  DBMS: 'Databases (DBMS)',
  OS: 'Operating Systems',
  NETWORKS: 'Computer Networks',
  CLOUD: 'Cloud & DevOps',
  SYSTEM_DESIGN: 'System Design',
};
