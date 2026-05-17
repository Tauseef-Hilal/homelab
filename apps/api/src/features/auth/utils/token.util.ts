import { createHash, randomUUID } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { UserPayload } from '../types/user.types';
import { JwtPayload, TokenMeta } from '../../../types/jwt.types';
import { tokenExpirations } from '@server/constants/token.constants';

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

export async function revokeFamilyTokens(
  tx: Omit<
    PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  familyId: string
) {
  await tx.refreshToken.updateMany({
    where: {
      familyId,
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
  meta: TokenMeta,
  familyId?: string
) {
  const newFamilyId = familyId || randomUUID();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashTokenSync(token),
      userId,
      familyId: newFamilyId,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(
        Date.now() + tokenExpirations.REFRESH_TOKEN_EXPIRY_MS
      ), // 7d
    },
  });
  return newFamilyId;
}
