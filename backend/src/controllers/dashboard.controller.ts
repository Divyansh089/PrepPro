import { asyncHandler } from '../utils/asyncHandler';
import * as dashboardService from '../services/dashboard.service';

// GET /api/dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  res.json(await dashboardService.getDashboard(req.userId!));
});

// GET /api/insights
export const getInsights = asyncHandler(async (req, res) => {
  res.json(await dashboardService.getInsights(req.userId!));
});
