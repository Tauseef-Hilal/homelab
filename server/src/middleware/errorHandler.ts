import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError';
import z, { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err); // Log the error instead

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      status: err.status,
      code: err.code,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: z.treeifyError(err),
    });
  }

  // Fallback for unknown errors
  return res.status(500).json({
    error: 'Internal Server Error',
  });
}
