import { UserRole } from '@prisma/client';
import { TfaPurpose } from '../constants/TfaPurpose';

export type TokenMeta = { userAgent?: string; ipAddress?: string };

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
};

export type TfaPayload = {
  userId: string;
  purpose: TfaPurpose;
  createdAt: number;
};
