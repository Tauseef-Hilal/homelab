import 'express';

declare global {
  namespace Express {
    interface Request {
      clientMeta?: { ipAddr: string; userAgent: string };
      user?: { id: string; email: string };
    }
  }
}
