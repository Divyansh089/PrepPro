import { api } from './base';
import type { Category, TestMode } from './tests';

export type ActivityItem = {
  type: TestMode | 'INTERVIEW';
  id: string;
  title: string; // test category, or interview role
  score: number;
  completedAt: string;
};

export type Dashboard = {
  totalPoints: number;
  rank: number | null; // null until the user has points
  testsCompleted: number;
  interviewsCompleted: number;
  avgScore: number;
  recentActivity: ActivityItem[];
};

export type Insights = {
  categories: Array<{ category: Category; tests: number; accuracy: number }>;
  strengths: Category[]; // accuracy 70 or more
  weaknesses: Category[]; // accuracy 50 or less
  scoreTrend: Array<{ id: string; category: Category; mode: TestMode; score: number; completedAt: string }>;
  interviews: {
    completed: number;
    overall: number;
    technical: number;
    communication: number;
    problemSolving: number;
  };
};

export const dashboardApi = {
  get: () => api.get<Dashboard>('/dashboard'),
  getInsights: () => api.get<Insights>('/insights'),
};
