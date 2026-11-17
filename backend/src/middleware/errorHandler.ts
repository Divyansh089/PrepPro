import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// Every error ends up here and is sent back as { message }
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Bad JSON in the request body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON' });
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
}
