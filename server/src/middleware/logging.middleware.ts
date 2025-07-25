import { Request, Response, NextFunction } from 'express';
import { withRequestId } from '@/lib/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string | undefined;
  req.logger = withRequestId(requestId);

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
