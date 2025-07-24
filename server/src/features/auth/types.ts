import { UserRole } from '@prisma/client';

export type TokenMeta = { userAgent?: string; ipAddress?: string };
export type UserPayload = { id: string; email: string; role: UserRole };
export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
};
