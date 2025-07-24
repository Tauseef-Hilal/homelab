import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { HttpError } from '@/errors/HttpError';
import { CommonErrorCode } from '@/errors/CommonErrorCode';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.FORBIDDEN,
        message: 'You are not authorized to view this resource',
      });
    }

    next();
  };
}
