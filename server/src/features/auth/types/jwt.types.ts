import { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
};
export type TokenMeta = { userAgent?: string; ipAddress?: string };
