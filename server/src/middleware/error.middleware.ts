import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError';
import z, { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      status: err.status,
      code: err.code,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    req.logger.warn({ details: z.treeifyError(err) }, 'Validation failed');

    return res.status(400).json({
      error: 'Validation failed',
      details: z.treeifyError(err),
    });
  }

  req.logger.error(
    {
      msg: (err as Error)?.message,
      stack: (err as Error)?.stack,
    },
    'Unhandled error occurred'
  );

  return res.status(500).json({
    error: 'Internal Server Error',
  });
}
