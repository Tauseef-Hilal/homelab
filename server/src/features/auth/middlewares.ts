import { NextFunction, Request, Response } from 'express';
import { getClientIp } from '@/lib/request';
import { throwUnauthorized, verifyAccessToken } from './utils';
import { UserRole } from '@prisma/client';
import { HttpError } from '@/errors/HttpError';
import { CommonErrorCode } from '@/errors/CommonErrorCode';

export function extractClientMeta(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.clientMeta = {
    ipAddr: getClientIp(req),
    userAgent: req.headers['user-agent'] || 'Unknown',
  };

  next();
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return throwUnauthorized();

  const token = authHeader.split(' ')[1];
  if (!token) return throwUnauthorized();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    throwUnauthorized();
  }
}

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
