import { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { hashPassword, comparePassword } from '../utils/hash';
import { UpdateProfileInput, ChangePasswordInput } from '../validators/user.validator';

// What the logged-in user gets back about themselves (never the passwordHash)
export function toUserResponse(user: User) {
  const { passwordHash, ...rest } = user;

  return {
    ...rest,
    isProfileComplete: Boolean(user.name && user.college && user.gradYear && user.targetRole),
  };
}

// What other users can see (no email)
function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    college: user.college,
    gradYear: user.gradYear,
    targetRole: user.targetRole,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    totalPoints: user.totalPoints,
    createdAt: user.createdAt,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // The token is valid but the user was deleted
  if (!user) {
    throw new AppError(401, 'User not found');
  }

  return toUserResponse(user);
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return toUserResponse(user);
}

export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(401, 'User not found');
  }

  const isMatch = await comparePassword(data.oldPassword, user.passwordHash);

  if (!isMatch) {
    throw new AppError(400, 'Current password is incorrect');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
}

export async function getPublicProfile(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return toPublicUser(user);
}
