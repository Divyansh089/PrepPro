import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// Usage: router.post('/signup', validate(signupSchema), signup);
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    // Use the parsed data (unknown fields removed, defaults applied)
    req.body = result.data;
    next();
  };
}
