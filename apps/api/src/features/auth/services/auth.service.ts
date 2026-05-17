import { Prisma } from '@prisma/client';
import { CommonErrorCode } from '@homelab/contracts/errors';
import { HttpError } from '@homelab/contracts/errors';
import { prisma } from '@homelab/db/prisma';
import { hashPassword, isValidPassword } from '@server/lib/bcrypt';
import { domainEvents, DomainEvent } from '@server/lib/events';
import {
  buildTokenPayload,
  hashTokenSync,
  revokeFamilyTokens,
  storeRefreshToken,
} from '../utils/token.util';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTfaToken,
  verifyRefreshToken,
} from '@server/lib/jwt';
import {
  throwExpiredToken,
  throwInvalidToken,
  throwTokenReused,
} from '../utils/error.util';
import { AuthErrorCode } from '../constants/AuthErrorCode';
import { TokenMeta } from '@server/types/jwt.types';
import { redis, RedisKeys } from '@homelab/infra/redis';
import { authConfig } from '../auth.config';
import { TfaPurpose } from '../constants/TfaPurpose';
import * as OtpService from '../services/otp.service';
import { USER_STORAGE_QUOTA } from '@homelab/contracts';

export async function getUserById(id: string) {
  return await prisma.user.findUnique({ where: { id } });
}

export async function signup(
  username: string,
  email: string,
  password: string,
  meta: TokenMeta,
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
      data: {
        username,
        email,
        password: hashedPassword,
        storageQuota: USER_STORAGE_QUOTA,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        role: true,
        username: true,
      },
    });

    domainEvents.emit(DomainEvent.USER_CREATED, { userId: user.id });

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

  const token = generateTfaToken({
    userId: user.id,
    email: user.email,
    purpose: TfaPurpose.LOGIN,
    createdAt: Date.now(),
  });

  return { user, token };
}

export async function logout(
  token: string,
  meta: TokenMeta,
  logoutAll = false,
) {
  verifyRefreshToken(token);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashTokenSync(token) },
    select: { id: true, userId: true, revokedAt: true, familyId: true },
  });

  if (!storedToken) return throwInvalidToken();
  if (storedToken.revokedAt) {
    await revokeFamilyTokens(prisma, storedToken.familyId);
    return throwTokenReused();
  }

  if (!logoutAll) {
    return await prisma.refreshToken.updateMany({
      where: { familyId: storedToken.familyId },
      data: { revokedAt: new Date() },
    });
  }

  return await prisma.refreshToken.updateMany({
    where: { userId: storedToken.userId },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(email: string, newPassword: string) {
  if (!newPassword) {
    throw new HttpError({
      status: 400,
      code: CommonErrorCode.MISSING_FIELDS,
      message: 'Missing fields',
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new HttpError({
      status: 404,
      code: AuthErrorCode.USER_DOES_NOT_EXIST,
      message: 'User does not exist',
    });
  }

  const canProceed = await redis.get(
    RedisKeys.auth.allowPasswordChange(user.id),
  );

  if (!canProceed) {
    throw new HttpError({
      status: 403,
      code: AuthErrorCode.OTP_VERIFICATION_REQUIRED,
      message: 'OTP verification required to change password',
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(newPassword) },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
}

export async function allowPasswordChange(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new HttpError({
      status: 404,
      code: AuthErrorCode.USER_DOES_NOT_EXIST,
      message: 'User does not exist',
    });
  }

  await OtpService.sendOtp(user.id, user.email);

  const token = generateTfaToken({
    userId: user.id,
    email: user.email,
    purpose: TfaPurpose.CHANGE_PASSWORD,
    createdAt: Date.now(),
  });

  return token;
}

export async function authorizePasswordChange(userId: string, email: string) {
  const expiresAt = String(
    Date.now() + authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS * 1000,
  );

  await redis.set(
    RedisKeys.auth.allowPasswordChange(userId),
    expiresAt,
    'EX',
    authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS,
  );

  const token = generateTfaToken({
    userId,
    email,
    purpose: TfaPurpose.PASSWORD_RESET_AUTHORIZED,
    createdAt: Date.now(),
  });

  return token;
}

export async function refreshTokens(refreshToken: string, meta: TokenMeta) {
  let result: {
    tokens: { access: string; refresh: string };
    user: { id: string; username: string; email: string; role: any };
  } | null = null;

  await prisma.$transaction(async (tx) => {
    const hashedToken = hashTokenSync(refreshToken);
    const storedToken = await tx.refreshToken.findUnique({
      where: { tokenHash: hashedToken },
      include: { user: true },
    });

    if (!storedToken) return throwInvalidToken();
    if (storedToken.expiresAt < new Date()) return throwExpiredToken();

    if (storedToken.revokedAt) {
      const timeSinceRevoked = Date.now() - storedToken.revokedAt.getTime();
      if (timeSinceRevoked < 30 * 1000) {
        // Grace period: allow rotation without immediate logout
      } else {
        await revokeFamilyTokens(tx, storedToken.familyId);
        return throwTokenReused();
      }
    } else {
      await tx.refreshToken.update({
        where: { tokenHash: hashedToken },
        data: { revokedAt: new Date() },
      });
    }

    const payload = buildTokenPayload(storedToken.user);
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await storeRefreshToken(tx, newRefreshToken, storedToken.userId, meta, storedToken.familyId);

    result = {
      tokens: { access: newAccessToken, refresh: newRefreshToken },
      user: {
        id: storedToken.user.id,
        username: storedToken.user.username,
        email: storedToken.user.email,
        role: storedToken.user.role,
      },
    };
  });

  if (!result) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Token refresh failed unexpectedly',
    });
  }

  return result as {
    tokens: { access: string; refresh: string };
    user: { id: string; username: string; email: string; role: any };
  };
}
