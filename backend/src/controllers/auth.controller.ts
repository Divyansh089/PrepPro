import { asyncHandler } from '../utils/asyncHandler';
import * as authService from '../services/auth.service';
import * as userService from '../services/user.service';

// POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.userId!);
  res.json(user);
});
