import { Request, Response, NextFunction } from 'express';

// Express 4 does not catch errors from async functions,
// so we wrap controllers with this to send errors to errorHandler
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
