import jwt from 'jsonwebtoken';
import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/binary';
import { env } from '@/config/env';
import { createHash } from 'crypto';
import { CommonErrorCode } from '@/errors/CommonErrorCode';
import { HttpError } from '@/errors/HttpError';
import { AuthErrorCode } from './enums';
import { TokenMeta } from './types';
import { authConfig } from './config';

export function generateAccessToken(payload: object): string {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: authConfig.ACCESS_TOKEN_EXPIRY_MS,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: object): string {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: authConfig.REFRESH_TOKEN_EXPIRY_MS,
  } as jwt.SignOptions);
}

export function verifyAccessToken<T = any>(token: string): T {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as T;
}

export function verifyRefreshToken<T = any>(token: string): T {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as T;
}

export function throwInvalidToken() {
  throw new HttpError({
    status: 401,
    code: AuthErrorCode.INVALID_TOKEN,
    message: 'Invalid token provided',
  });
}

export function throwExpiredToken() {
  throw new HttpError({
    status: 401,
    code: AuthErrorCode.TOKEN_EXPIRED,
    message: 'Token expired',
  });
}

export function throwTokenReused() {
  throw new HttpError({
    status: 401,
    code: AuthErrorCode.TOKEN_REUSED,
    message: 'Suspicious token activity detected',
  });
}

export function throwUnauthorized() {
  throw new HttpError({
    status: 401,
    code: CommonErrorCode.UNAUTHORIZED,
    message: 'Access token is missing or invalid',
  });
}

export function hashTokenSync(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function buildTokenPayload(
  user: { id: string; email: string },
  meta: TokenMeta
) {
  return {
    sub: user.id,
    email: user.email,
    userAgent: meta.userAgent,
    ip: meta.ipAddress,
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
