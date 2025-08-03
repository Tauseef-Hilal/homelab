import { Request, Response, NextFunction } from 'express';
import { withRequestId } from '@shared/logging';
import { randomUUID } from 'crypto';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string | undefined;
  req.id = requestId ?? randomUUID();
  req.logger = withRequestId(req.id);

  req.logger.info({
    msg: `Incoming request`,
    method: req.method,
    url: req.originalUrl,
  });

  res.on('finish', () => {
    req.logger.info({
      msg: `Request completed`,
      statusCode: res.statusCode,
      method: req.method,
      url: req.originalUrl,
    });
  });

  next();
}
