import { createHash } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { authConfig } from '../auth.config';
import { UserPayload } from '../types/user.types';
import { JwtPayload, TokenMeta } from '../types/jwt.types';

export function hashTokenSync(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function buildTokenPayload(user: UserPayload): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
  };
}

export async function revokeMatchingTokens(
  tx: Omit<
    PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  userId: string,
  meta: TokenMeta
) {
  await tx.refreshToken.updateMany({
    where: {
      userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { revokedAt: new Date() },
  });
}

export async function storeRefreshToken(
  prisma: Omit<
    PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  token: string,
  userId: string,
  meta: TokenMeta
) {
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashTokenSync(token),
      userId,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + authConfig.REFRESH_TOKEN_EXPIRY_MS), // 7d
    },
  });
}
