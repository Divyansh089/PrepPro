import { z } from "zod";

export const practiceFilterSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(["all", "easy", "medium", "hard"]).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
});

export type PracticeFilterInput = z.infer<typeof practiceFilterSchema>;

export const practiceSubmissionSchema = z.object({
  questionId: z.string().min(1, { message: "Question ID is required" }),
  code: z.string().min(1, { message: "Code cannot be empty" }),
  language: z.string().min(1, { message: "Language is required" }),
});

export type PracticeSubmissionInput = z.infer<typeof practiceSubmissionSchema>;
