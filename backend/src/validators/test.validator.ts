import { z } from 'zod';
import { Category, Difficulty, TestMode } from '@prisma/client';

export const createTestSchema = z.object({
  mode: z.nativeEnum(TestMode),
  category: z.nativeEnum(Category),
  difficulty: z.nativeEnum(Difficulty),
  count: z.number().int().min(1).max(20).default(10),
});

export const submitTestSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.array(z.string().max(1000)).max(10),
      })
    )
    .max(50),
});

// Query params are always strings, so we convert page/limit to numbers
export const listTestsSchema = z.object({
  mode: z.nativeEnum(TestMode).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
export type SubmitTestInput = z.infer<typeof submitTestSchema>;
export type ListTestsInput = z.infer<typeof listTestsSchema>;
