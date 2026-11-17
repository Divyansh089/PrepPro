import { asyncHandler } from '../utils/asyncHandler';
import * as userService from '../services/user.service';

// PUT /api/users/me
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.userId!, req.body);
  res.json(user);
});

// PUT /api/users/me/password
export const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.userId!, req.body);
  res.json({ message: 'Password updated' });
});

// GET /api/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getPublicProfile(req.params.id);
  res.json(user);
});
