import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError';
import z, { ZodError } from 'zod';
import { error } from '@server/lib/response';
import { CommonErrorCode } from '@server/errors/CommonErrorCode';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof HttpError) {
    req.logger.error(
      {
        msg: (err as Error)?.message,
        stack: (err as Error)?.stack,
      },
      'Internal server error occured'
    );

    return res.status(err.status).json(error(err.message, err.code));
  }

  if (err instanceof ZodError) {
    req.logger.warn({ details: z.treeifyError(err) }, 'Validation failed');

    return res
      .status(400)
      .json(
        error(
          'Validation failed',
          CommonErrorCode.BAD_REQUEST,
          z.treeifyError(err)
        )
      );
  }

  req.logger.error(
    {
      msg: (err as Error)?.message,
      stack: (err as Error)?.stack,
    },
    'Unhandled error occurred'
  );

  return res
    .status(500)
    .json(
      error('An internal error occured', CommonErrorCode.INTERNAL_SERVER_ERROR)
    );
}
