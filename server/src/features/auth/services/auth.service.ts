import { Prisma } from '@prisma/client';
import { CommonErrorCode } from '@/errors/CommonErrorCode';
import { HttpError } from '@/errors/HttpError';
import { prisma } from '@/lib/prisma';
import { hashPassword, isValidPassword } from '@/lib/bcrypt';
import {
  buildTokenPayload,
  hashTokenSync,
  revokeMatchingTokens,
  storeRefreshToken,
} from '../utils/token.util';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.util';
import {
  throwExpiredToken,
  throwInvalidToken,
  throwTokenReused,
  throwUnauthorized,
} from '../utils/error.util';
import { AuthErrorCode } from '../constants/AuthErrorCode';
import { TokenMeta } from '../types/jwt.types';
import redis from '@/lib/redis/redis';
import { RedisKeys } from '@/lib/redis/redisKeys';
import { authConfig } from '../auth.config';

export async function signup(
  username: string,
  email: string,
  password: string,
  meta: TokenMeta
) {
  if (!username || !email || !password)
    throw new HttpError({
      status: 400,
      code: CommonErrorCode.MISSING_FIELDS,
      message: 'Username, email and password are required',
    });

  try {
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
      select: { id: true, email: true, createdAt: true, role: true },
    });

    const payload = buildTokenPayload({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await storeRefreshToken(prisma, refreshToken, user.id, meta);

    return { user, tokens: { access: accessToken, refresh: refreshToken } };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new HttpError({
        status: 409,
        code: AuthErrorCode.EMAIL_ALREADY_USED,
        message: 'Email is already in use',
      });
    }

    throw new HttpError({
      status: 500,
      code: AuthErrorCode.SIGNUP_FAILED,
      message: 'Failed to sign up user',
    });
  }
}

export async function login(email: string, password: string, meta: TokenMeta) {
  if (!email || !password) {
    throw new HttpError({
      status: 400,
      code: CommonErrorCode.MISSING_FIELDS,
      message: 'Email and password are required',
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, password: true, role: true },
  });

  if (!user) {
    throw new HttpError({
      status: 401,
      code: AuthErrorCode.USER_DOES_NOT_EXIST,
      message: 'No user with the given email exists',
    });
  }

  if (!(await isValidPassword(password, user.password))) {
    throw new HttpError({
      status: 401,
      code: AuthErrorCode.INVALID_CREDENTIALS,
      message: 'Invalid email or password',
    });
  }
}

export async function logout(
  token: string,
  meta: TokenMeta,
  logoutAll = false
) {
  verifyRefreshToken(token);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashTokenSync(token) },
  });

  if (!storedToken) return throwInvalidToken();
  if (storedToken.revokedAt) {
    await revokeMatchingTokens(prisma, storedToken.userId, meta);
    return throwTokenReused();
  }

  if (!logoutAll) {
    return await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });
  }

  return await prisma.refreshToken.updateMany({
    where: { userId: storedToken.userId },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  if (!userId) return throwUnauthorized();

  if (!oldPassword || !newPassword) {
    throw new HttpError({
      status: 400,
      code: CommonErrorCode.MISSING_FIELDS,
      message: 'Missing fields',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    throw new HttpError({
      status: 401,
      code: AuthErrorCode.USER_DOES_NOT_EXIST,
      message: 'User does not exist',
    });
  }

  if (!(await isValidPassword(oldPassword, user.password)))
    return throwUnauthorized();

  await prisma.user.update({
    where: { id: userId },
    data: { password: await hashPassword(newPassword) },
  });

  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function allowPasswordChange(userId: string) {
  await redis.set(
    RedisKeys.auth.allowPasswordChange(userId),
    Date.now() + authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS * 1000,
    'EX',
    authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS
  );
}

export async function refreshTokens(refreshToken: string, meta: TokenMeta) {
  let result: { tokens: { access: string; refresh: string } } | null = null;

  await prisma.$transaction(async (tx) => {
    const hashedToken = hashTokenSync(refreshToken);
    const storedToken = await tx.refreshToken.findUnique({
      where: { tokenHash: hashedToken },
      include: { user: true },
    });

    if (!storedToken) return throwInvalidToken();
    if (storedToken.expiresAt < new Date()) return throwExpiredToken();

    if (storedToken.revokedAt) {
      // Replay protection may need improvement
      await revokeMatchingTokens(tx, storedToken.userId, meta);
      return throwTokenReused();
    }

    await tx.refreshToken.update({
      where: { tokenHash: hashedToken },
      data: { revokedAt: new Date() },
    });

    const payload = buildTokenPayload(storedToken.user);
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await storeRefreshToken(tx, newRefreshToken, storedToken.userId, meta);

    result = { tokens: { access: newAccessToken, refresh: newRefreshToken } };
  });

  if (!result) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Token refresh failed unexpectedly',
    });
  }

  return result as { tokens: { access: string; refresh: string } };
}
