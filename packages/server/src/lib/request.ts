import { Request } from 'express';

export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];

  // If x-forwarded-for is a comma-separated list, take the first one
  const ipFromHeader =
    typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0].trim()
      : undefined;

  return (
    ipFromHeader ||
    req.ip || // Express may already provide a trusted IP
    req.socket?.remoteAddress || // Fallback for raw Node requests
    'unknown'
  );
}
