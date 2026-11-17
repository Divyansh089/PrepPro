import { asyncHandler } from '../utils/asyncHandler';
import * as leaderboardService from '../services/leaderboard.service';
import { leaderboardQuerySchema, LeaderboardQuery } from '../validators/leaderboard.validator';

// GET /api/leaderboard?limit=50
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { limit } = leaderboardQuerySchema.parse(req.query) as LeaderboardQuery;
  res.json(await leaderboardService.getLeaderboard(req.userId!, limit));
});
