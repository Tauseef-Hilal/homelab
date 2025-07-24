import { NextFunction, Request, Response } from 'express';
import { throwUnauthorized } from '../utils/error.util';
import { verifyAccessToken } from '../utils/jwt.util';

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
