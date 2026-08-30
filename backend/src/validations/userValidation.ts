import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  college: z.string().optional(),
  gradYear: z.string().optional(),
  targetRole: z.string().optional(),
  avatar: z.string().optional(),
  skills: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  activityData: z.any().optional(),
});

export const updateStatsSchema = z.object({
  rank: z.number().optional(),
  totalScore: z.number().optional(),
  testsCompleted: z.number().optional(),
  questionsSolved: z.number().optional(),
  studyHours: z.number().optional(),
  accuracy: z.number().optional(),
  avgTime: z.string().optional(),
});
