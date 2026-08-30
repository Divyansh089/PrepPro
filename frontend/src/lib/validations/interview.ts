import { z } from "zod";

export const interviewSetupSchema = z.object({
  role: z.string().min(2, { message: "Role is required" }),
  experienceLevel: z.enum(["fresher", "mid", "senior"]),
  targetCompany: z.string().min(1, { message: "Target company is required" }),
  interviewType: z.enum(["technical", "behavioral", "system-design", "mixed"]),
  questionCount: z.number().min(1).max(20).default(5),
});

export type InterviewSetupInput = z.infer<typeof interviewSetupSchema>;

export const interviewAnswerSchema = z.object({
  sessionId: z.string().min(1, { message: "Session ID is required" }),
  content: z.string().min(1, { message: "Answer cannot be empty" }),
  questionId: z.string().optional(),
  code: z.string().optional(),
  language: z.string().optional(),
});

export type InterviewAnswerInput = z.infer<typeof interviewAnswerSchema>;
