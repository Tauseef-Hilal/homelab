import { NextFunction, Request, Response } from 'express';
import { getClientIp } from '@/lib/request';
import { throwUnauthorized, verifyAccessToken } from './utils';

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
    const payload = verifyAccessToken<{ sub: string; email: string }>(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    throwUnauthorized();
  }
}
