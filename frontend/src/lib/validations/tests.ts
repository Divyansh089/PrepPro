import { z } from "zod";

export const testSubmissionSchema = z.object({
  testId: z.string().min(1, { message: "Test ID is required" }),
  answers: z.record(z.string(), z.any()),
  timeSpent: z.number().min(0).optional(),
});

export type TestSubmissionInput = z.infer<typeof testSubmissionSchema>;
