import { z } from 'zod';

// Every field is optional, so the frontend can update just one field
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50).optional(),
  bio: z.string().trim().max(500, 'Bio cannot be more than 500 characters').optional(),
  college: z.string().trim().max(150).optional(),
  gradYear: z.number().int().min(1950).max(2100).nullable().optional(),
  targetRole: z.string().trim().max(100).optional(),
  avatarUrl: z.string().trim().url('Invalid URL').or(z.literal('')).optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
