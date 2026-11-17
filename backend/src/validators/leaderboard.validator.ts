import { z } from 'zod';

export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Written by hand because strict mode is off, so z.infer makes every field optional
export type LeaderboardQuery = { limit: number };
