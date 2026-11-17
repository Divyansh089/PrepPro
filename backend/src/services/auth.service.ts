import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { SignupInput, LoginInput } from '../validators/auth.validator';
import { toUserResponse } from './user.service';

export async function signup(data: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  if (existing) {
    throw new AppError(409, 'An account with this email already exists');
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
    },
  });

  return { token: signToken(user.id), user: toUserResponse(user) };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  // Same message for both cases, so nobody can check which emails are registered
  if (!user || !(await comparePassword(data.password, user.passwordHash))) {
    throw new AppError(401, 'Invalid email or password');
  }

  return { token: signToken(user.id), user: toUserResponse(user) };
}
