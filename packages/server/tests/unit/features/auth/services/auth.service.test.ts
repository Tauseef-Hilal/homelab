import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '@server/features/auth/services/auth.service';
import * as otpService from '@server/features/auth/services/otp.service';
import * as bcrypt from '@server/lib/bcrypt';
import * as jwtUtils from '@server/lib/jwt';
import * as tokenUtils from '@server/features/auth/utils/token.util';
import { HttpError } from '@server/errors/HttpError';
import { prisma } from '@shared/prisma';
import { Prisma, RefreshToken, User } from '@prisma/client';
import { AuthErrorCode } from '@server/features/auth/constants/AuthErrorCode';
import { CommonErrorCode } from '@server/errors/CommonErrorCode';
import { JwtPayload } from '@server/types/jwt.types';
import redis from '@shared/redis';
import { RedisKeys } from '@shared/redis/redisKeys';
import { authConfig } from '@server/features/auth/auth.config';

vi.mock('@shared/prisma');

const meta = { ipAddress: '127.0.0.1', userAgent: 'Vitest' };
const mockUser = {
  id: 'user-id',
  email: 'email@example.com',
  createdAt: new Date(),
  role: 'USER',
} as any as User;

describe('signup()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should through if fields are missing', async () => {
    await expect(authService.signup('', 'email', 'pass', meta)).rejects.toThrow(
      HttpError
    );
    await expect(
      authService.signup('username', '', 'pass', meta)
    ).rejects.toThrow(HttpError);
    await expect(
      authService.signup('username', 'email', '', meta)
    ).rejects.toThrow(HttpError);
  });

  it('returns user and tokens on successful signup', async () => {
    const mockAccessToken = 'access-token';
    const mockRefreshToken = 'refresh-token';

    vi.spyOn(bcrypt, 'hashPassword').mockResolvedValue('hashed-pass');
    vi.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);
    vi.spyOn(jwtUtils, 'generateAccessToken').mockReturnValue(mockAccessToken);
    vi.spyOn(jwtUtils, 'generateRefreshToken').mockReturnValue(
      mockRefreshToken
    );
    const storeRefreshToken = vi
      .spyOn(tokenUtils, 'storeRefreshToken')
      .mockResolvedValue();

    const res = await authService.signup(
      'user',
      mockUser.email,
      'pass123',
      meta
    );

    expect(res.user).toMatchObject(mockUser);
    expect(res.tokens.access).toBe(mockAccessToken);
    expect(res.tokens.refresh).toBe(mockRefreshToken);
    expect(storeRefreshToken).toHaveBeenCalledWith(
      prisma,
      mockRefreshToken,
      mockUser.id,
      meta
    );
  });

  it('throws 409 if email is duplicate (P2002)', async () => {
    vi.spyOn(bcrypt, 'hashPassword').mockResolvedValue('hashed-pass');
    vi.spyOn(prisma.user, 'create').mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('error', {
        code: 'P2002',
        clientVersion: '4.0.0',
      })
    );

    await expect(
      authService.signup('user', 'email@example.com', 'pass', meta)
    ).rejects.toMatchObject({ status: 409 });
  });

  it('throws 500 on unknown error', async () => {
    vi.spyOn(bcrypt, 'hashPassword').mockResolvedValue('hashed-pass');
    vi.spyOn(prisma.user, 'create').mockRejectedValue(new Error('Unexpected'));

    await expect(
      authService.signup('user', 'email@example.com', 'pass123', meta)
    ).rejects.toMatchObject({ status: 500 });
  });
});

describe('login()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should throw if fields are missing', async () => {
    const errorObj = {
      status: 400,
      code: CommonErrorCode.MISSING_FIELDS,
    };
    await expect(authService.login('email', '', meta)).rejects.toMatchObject(
      errorObj
    );
    await expect(authService.login('', 'pass', meta)).rejects.toMatchObject(
      errorObj
    );
  });

  it('should throw if user does not exist', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    await expect(
      authService.login('email', 'pass', meta)
    ).rejects.toMatchObject({
      status: 401,
      code: AuthErrorCode.USER_DOES_NOT_EXIST,
    });
  });

  it('should throw if password is invalid', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
    vi.spyOn(bcrypt, 'isValidPassword').mockResolvedValue(false);

    await expect(
      authService.login(mockUser.email, 'pass', meta)
    ).rejects.toMatchObject({
      status: 401,
      code: AuthErrorCode.INVALID_CREDENTIALS,
    });
  });

  it('should return user and 2fa token on valid credentials', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
    vi.spyOn(bcrypt, 'isValidPassword').mockResolvedValue(true);

    const mockToken = '2fa-token';
    vi.spyOn(jwtUtils, 'generateTfaToken').mockReturnValue(mockToken);

    expect(await authService.login('email', 'pass', meta)).toMatchObject({
      user: mockUser,
      token: mockToken,
    });
  });
});

describe('logout()', () => {
  const mockToken = 'refresh-token';
  const mockTokenHash = 'alphabetagama';
  const tokenRecord = {
    id: 'token-id',
    userId: mockUser.id,
    revokedAt: null,
  } as any as RefreshToken;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(tokenUtils, 'hashTokenSync').mockReturnValue(mockTokenHash);
    vi.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue({} as JwtPayload);
  });

  it('should revoke a single token', async () => {
    vi.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue(tokenRecord);

    const updateSpy = vi
      .spyOn(prisma.refreshToken, 'update')
      .mockResolvedValue({ ...tokenRecord, revokedAt: new Date() });

    const result = await authService.logout(mockToken, meta, false);

    expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(mockToken);

    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: mockTokenHash },
      select: { id: true, userId: true, revokedAt: true },
    });

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: tokenRecord.id },
      data: { revokedAt: expect.any(Date) },
    });

    expect(result).toHaveProperty('revokedAt');
  });

  it('should revoke all tokens if logoutAll is true', async () => {
    vi.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue(tokenRecord);

    const updateManySpy = vi
      .spyOn(prisma.refreshToken, 'updateMany')
      .mockResolvedValue({ count: 2 });

    const result = await authService.logout(mockToken, meta, true);

    expect(updateManySpy).toHaveBeenCalledWith({
      where: { userId: tokenRecord.userId },
      data: { revokedAt: expect.any(Date) },
    });

    expect(result).toEqual({ count: 2 });
  });

  it('should throw if token is not found', async () => {
    vi.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue(null);

    await expect(authService.logout(mockToken, meta)).rejects.toMatchObject({
      status: 401,
      code: AuthErrorCode.INVALID_TOKEN,
    });
  });

  it('should revoke matching tokens and throw if token was reused', async () => {
    vi.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue({
      ...tokenRecord,
      revokedAt: new Date(),
    });

    const revokeMatchingTokensSpy = vi
      .spyOn(tokenUtils, 'revokeMatchingTokens')
      .mockResolvedValue();

    await expect(authService.logout(mockToken, meta)).rejects.toMatchObject({
      status: 401,
      code: AuthErrorCode.TOKEN_REUSED,
    });

    expect(revokeMatchingTokensSpy).toHaveBeenCalled();
  });
});

describe('changePassword()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should throw if fields are missing', async () => {
    const errorObj = { status: 400, code: CommonErrorCode.MISSING_FIELDS };

    await expect(
      authService.changePassword('email', '', 'new')
    ).rejects.toMatchObject(errorObj);

    await expect(
      authService.changePassword('email', 'old', '')
    ).rejects.toMatchObject(errorObj);

    await expect(
      authService.changePassword('', 'old', 'new')
    ).rejects.toMatchObject({
      status: 404,
      code: AuthErrorCode.USER_DOES_NOT_EXIST,
    });
  });

  it('should throw if user does not exist', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    await expect(
      authService.changePassword('email', 'old', 'pass')
    ).rejects.toMatchObject({
      status: 404,
      code: AuthErrorCode.USER_DOES_NOT_EXIST,
    });
  });

  it('should throw if old password is wrong', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
    vi.spyOn(bcrypt, 'isValidPassword').mockResolvedValue(false);

    await expect(
      authService.changePassword('email', 'old', 'new')
    ).rejects.toMatchObject({
      status: 401,
      code: CommonErrorCode.UNAUTHORIZED,
    });
  });

  it('should update password and delete matching tokens', async () => {
    const mockHashedPassword = 'hashedPswd';
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
    vi.spyOn(bcrypt, 'isValidPassword').mockResolvedValue(true);
    vi.spyOn(bcrypt, 'hashPassword').mockResolvedValue(mockHashedPassword);
    vi.spyOn(redis, 'get').mockResolvedValue('ok');

    const updateSpy = vi.spyOn(prisma.user, 'update');
    const deleteManySpy = vi.spyOn(prisma.refreshToken, 'deleteMany');

    await authService.changePassword(mockUser.email, 'old', 'pass');

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { password: mockHashedPassword },
    });
    expect(deleteManySpy).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
    });
  });
});

describe('allowPasswordChange()', () => {
  it('should throw if user does not exist', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    await expect(
      authService.allowPasswordChange('email')
    ).rejects.toMatchObject({
      status: 404,
      code: AuthErrorCode.USER_DOES_NOT_EXIST,
    });
  });

  it('should set password change identifier for user in redis', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
    vi.spyOn(redis, 'get').mockResolvedValue(null);
    vi.spyOn(otpService, 'sendOtp').mockResolvedValue();

    const redisSpy = vi.spyOn(redis, 'set');
    await authService.allowPasswordChange(mockUser.email);

    expect(redisSpy).toHaveBeenCalledWith(
      RedisKeys.auth.allowPasswordChange(mockUser.id),
      expect.any(String),
      'EX',
      authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS
    );
  });
});

describe('refreshTokens()', () => {
  const mockToken = 'token';
  const mockHashedToken = 'hashed-token';
  const mockTokenRecord = {
    id: 'token-id',
    userId: 'user-123',
    expiresAt: new Date(Date.now() + 10000),
    revokedAt: null,
  } as RefreshToken;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(tokenUtils, 'hashTokenSync').mockReturnValue(mockHashedToken);
    vi.spyOn(prisma, '$transaction');
  });

  it('should throw if token is invalid', async () => {
    const tx = {
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    (prisma.$transaction as any).mockImplementation(
      async (fn: (tx: any) => Promise<any>) => {
        await fn(tx);
      }
    );

    await expect(
      authService.refreshTokens(mockToken, meta)
    ).rejects.toMatchObject({
      status: 401,
      code: AuthErrorCode.INVALID_TOKEN,
    });
  });

  it('should throw if the token is expired', async () => {
    const expiredTokenRecord = {
      ...mockTokenRecord,
      expiresAt: new Date(Date.now() - 10000),
    };

    const tx = {
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue(expiredTokenRecord),
      },
    };

    (prisma.$transaction as any).mockImplementation(
      async (fn: (tx: any) => Promise<any>) => {
        await fn(tx);
      }
    );

    await expect(
      authService.refreshTokens(mockToken, meta)
    ).rejects.toMatchObject({ status: 401, code: AuthErrorCode.TOKEN_EXPIRED });
  });

  it('should throw if result is unexpectedly null', async () => {
    (prisma.$transaction as any).mockImplementation(async () => {
      // simulate silent return with no result assignment
    });

    await expect(
      authService.refreshTokens(mockToken, meta)
    ).rejects.toMatchObject({ status: 500 });
  });

  it('should revoke other tokens and throw if token is reused', async () => {
    const reusedToken = { ...mockTokenRecord, revokedAt: new Date() };

    const tx = {
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue(reusedToken),
        updateMany: vi.fn(),
      },
    };

    (prisma.$transaction as any).mockImplementation(
      async (fn: (tx: any) => Promise<any>) => {
        await fn(tx);
      }
    );

    const revokeMatchingTokensSpy = vi.spyOn(
      tokenUtils,
      'revokeMatchingTokens'
    );

    await expect(
      authService.refreshTokens(mockToken, meta)
    ).rejects.toMatchObject({ status: 401, code: AuthErrorCode.TOKEN_REUSED });

    expect(revokeMatchingTokensSpy).toBeCalledWith(
      tx,
      reusedToken.userId,
      meta
    );
  });

  it('should refresh tokens successfully', async () => {
    const tx = {
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue(mockTokenRecord),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    const newAccessToken = 'new-access-token';
    const newRefreshToken = 'new-refresh-token';

    (prisma.$transaction as any).mockImplementation(
      async (fn: (tx: any) => Promise<any>) => {
        await fn(tx);
      }
    );

    vi.spyOn(tokenUtils, 'buildTokenPayload').mockReturnValue({} as JwtPayload);

    vi.spyOn(jwtUtils, 'generateAccessToken').mockReturnValue(newAccessToken);
    vi.spyOn(jwtUtils, 'generateRefreshToken').mockReturnValue(newRefreshToken);

    const storeRefreshTokenSpy = vi
      .spyOn(tokenUtils, 'storeRefreshToken')
      .mockResolvedValue();

    const result = await authService.refreshTokens(mockToken, meta);

    expect(result.tokens.access).toBe(newAccessToken);
    expect(result.tokens.refresh).toBe(newRefreshToken);
    expect(storeRefreshTokenSpy).toHaveBeenCalledWith(
      tx,
      newRefreshToken,
      mockTokenRecord.userId,
      meta
    );
  });
});
