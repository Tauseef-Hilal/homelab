import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { loggerWithContext } from '@homelab/infra/logging';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string | undefined;
  req.id = requestId ?? randomUUID();

  req.logger = loggerWithContext({
    service: 'api',
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    userIp: req.clientMeta?.ipAddr,
    userAgent: req.clientMeta?.userAgent,
  });

  req.logger.info({
    msg: 'Incoming request',
  });

  res.on('finish', () => {
    const endTime = Date.now();

    req.logger.info({
      msg: `Request completed`,
      statusCode: res.statusCode,
      duration: `${endTime - startTime}ms`,
    });
  });

  res.setHeader('x-request-id', req.id);
  next();
}
