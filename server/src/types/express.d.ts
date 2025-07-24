import 'express';
import { UserRole } from '@prisma/client';
import { UserPayload } from '@/features/auth/types';

declare global {
  namespace Express {
    interface Request {
      clientMeta?: { ipAddr: string; userAgent: string };
      user?: UserPayload;
    }
  }
}
