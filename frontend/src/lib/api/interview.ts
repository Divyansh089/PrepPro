import { api } from './base';

export type Level = 'FRESHER' | 'MID' | 'SENIOR';
export type InterviewType = 'TECHNICAL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN' | 'MIXED';
export type Language = 'javascript' | 'python' | 'java' | 'cpp';

export type InterviewMessage = {
  id: string;
  sender: 'AI' | 'USER';
  content: string;
  code: string | null;
  language: string | null;
  createdAt: string;
};

export type Interview = {
  id: string;
  role: string;
  level: Level;
  type: InterviewType;
  language: Language;
  company: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  // Scores are 0-100 and only set after the interview ends
  overallScore: number | null;
  technicalScore: number | null;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  feedback: string | null;
  startedAt: string;
  completedAt: string | null;
};

export type InterviewWithMessages = Interview & { messages: InterviewMessage[] };

export type CreateInterviewInput = {
  role: string;
  level: Level;
  type: InterviewType;
  language: Language;
  company?: string;
};

export type RunResult = {
  status: string;
  stdout: string;
  stderr: string;
  time: number | null;
};

export const interviewApi = {
  create: (input: CreateInterviewInput) => api.post<InterviewWithMessages>('/interviews', input),

  list: (page = 1, limit = 10) =>
    api.get<{ interviews: Interview[]; page: number; limit: number; total: number }>(
      `/interviews?page=${page}&limit=${limit}`
    ),

  get: (id: string) => api.get<InterviewWithMessages>(`/interviews/${id}`),

  sendMessage: (id: string, input: { content: string; code?: string; language?: Language }) =>
    api.post<{ userMessage: InterviewMessage; aiMessage: InterviewMessage }>(`/interviews/${id}/messages`, input),

  runCode: (id: string, input: { code: string; language: Language; stdin?: string }) =>
    api.post<RunResult>(`/interviews/${id}/run-code`, input),

  end: (id: string) => api.post<Interview>(`/interviews/${id}/end`),
};

export const LEVEL_LABELS: Record<Level, string> = {
  FRESHER: 'Fresher (0-2 years)',
  MID: 'Mid level (2-5 years)',
  SENIOR: 'Senior (5+ years)',
};

export const TYPE_LABELS: Record<InterviewType, string> = {
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  SYSTEM_DESIGN: 'System design',
  MIXED: 'Mixed',
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
};
