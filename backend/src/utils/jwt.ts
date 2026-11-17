import jwt from 'jsonwebtoken';
import { env } from '../config/env';

type TokenPayload = {
  userId: string;
};

export function signToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '7d' });
}

// Throws an error if the token is invalid or expired
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
