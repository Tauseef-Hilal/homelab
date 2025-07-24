import { NextFunction, Request, Response } from 'express';
import { getClientIp } from '@/lib/request';

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

