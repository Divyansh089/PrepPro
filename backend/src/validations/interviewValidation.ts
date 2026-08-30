import { z } from 'zod';

export const createSessionSchema = z.object({
  role: z.string().optional(),
  experienceLevel: z.string().optional(),
  targetCompany: z.string().optional(),
  interviewType: z.string().optional(),
  questionCount: z.number().optional(),
});

export const sendMessageSchema = z.object({
  sessionId: z.string().min(1, { message: 'sessionId is required' }),
  content: z.string().min(1, { message: 'content is required' }),
  questionId: z.string().optional(),
  code: z.string().optional(),
  language: z.string().optional(),
});

export const endSessionSchema = z.object({
  sessionId: z.string().min(1, { message: 'sessionId is required' }),
});
