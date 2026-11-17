import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Adds userId to the Request type so controllers can use req.userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
