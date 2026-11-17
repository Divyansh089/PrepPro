import { z } from 'zod';
import { Level, InterviewType } from '@prisma/client';

export const LANGUAGES = ['javascript', 'python', 'java', 'cpp'] as const;
export type Language = (typeof LANGUAGES)[number];

export const createInterviewSchema = z.object({
  role: z.string().trim().min(2).max(100),
  level: z.nativeEnum(Level),
  type: z.nativeEnum(InterviewType),
  language: z.enum(LANGUAGES),
  company: z.string().trim().max(100).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  code: z.string().max(20000).optional(),
  language: z.enum(LANGUAGES).optional(),
});

export const runCodeSchema = z.object({
  code: z.string().min(1).max(20000),
  language: z.enum(LANGUAGES),
  stdin: z.string().max(5000).optional(),
});

export const listInterviewsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Written by hand because strict mode is off, so z.infer makes every field optional
export type CreateInterviewInput = {
  role: string;
  level: Level;
  type: InterviewType;
  language: Language;
  company?: string;
};

export type SendMessageInput = {
  content: string;
  code?: string;
  language?: Language;
};

export type RunCodeInput = {
  code: string;
  language: Language;
  stdin?: string;
};

export type ListInterviewsInput = {
  page: number;
  limit: number;
};
