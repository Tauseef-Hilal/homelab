import { beforeEach, describe, expect, it, vi } from 'vitest';
import logger from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { env } from '@/config/env';
import { HttpError } from '@/errors/HttpError';
import { CommonErrorCode } from '@/errors/CommonErrorCode';
import { errorHandler } from '@/middleware/error.middleware';
import { TfaPurpose } from '@/features/auth/constants/TfaPurpose';
import { TfaPayload } from '@/types/jwt.types';
import * as AuthService from '@/features/auth/services/auth.service';
import * as OtpService from '@/features/auth/services/otp.service';
import * as JwtUtils from '@/lib/jwt';
import * as TokenUtils from '@/features/auth/utils/token.util';
import { verifyOtpController } from '@/features/auth/controllers/verifyOtp.controller';
import { tokenExpirations } from '@/constants/token.constants';

vi.mock('@/lib/logger');
vi.mock('@/lib/prisma');

describe('verifyOtpController', () => {
  const mockOtp = '123456';
  const mockToken = 'tfa-token';
  const mockTokens = { access: 'access-token', refresh: 'refresh-token' };
  const mockTokenPayload = {
    userId: 'user-123',
    purpose: TfaPurpose.CHANGE_PASSWORD,
  };
  const mockUser = { id: 'user-123', email: 'user@example.com', role: 'USER' };

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      body: {
        token: mockToken,
        otp: mockOtp,
      },
      logger: logger,
      clientMeta: { ipAddress: '127.0.0.1', userAgent: 'Vitest' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn().mockImplementation((err) => {
      errorHandler(err, req, res, next);
    });

    vi.spyOn(AuthService, 'allowPasswordChange').mockResolvedValue();
  });

  it('should verify OTP and allow password change', async () => {
    vi.spyOn(OtpService, 'verifyOtp').mockResolvedValue();
    vi.spyOn(JwtUtils, 'verifyTfaToken').mockReturnValue(
      mockTokenPayload as TfaPayload
    );

    await verifyOtpController(req, res, next);
    expect(OtpService.verifyOtp).toHaveBeenCalledWith(
      mockTokenPayload.userId,
      mockOtp
    );
    expect(next).not.toHaveBeenCalled();
    expect(AuthService.allowPasswordChange).toHaveBeenCalledWith(
      mockTokenPayload.userId
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Continue to change password',
    });
  });

  it('should verify OTP and login user', async () => {
    const payload = { ...mockTokenPayload, purpose: TfaPurpose.LOGIN };

    vi.spyOn(OtpService, 'verifyOtp').mockResolvedValue();
    vi.spyOn(TokenUtils, 'storeRefreshToken').mockResolvedValue();
    vi.spyOn(JwtUtils, 'generateAccessToken').mockReturnValue(
      mockTokens.access
    );
    vi.spyOn(JwtUtils, 'generateRefreshToken').mockReturnValue(
      mockTokens.refresh
    );
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as User);
    vi.spyOn(JwtUtils, 'verifyTfaToken').mockReturnValue(payload as TfaPayload);

    await verifyOtpController(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(OtpService.verifyOtp).toHaveBeenCalledWith(payload.userId, mockOtp);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: payload.userId },
    });
    expect(JwtUtils.generateAccessToken).toHaveBeenCalled();
    expect(JwtUtils.generateRefreshToken).toHaveBeenCalled();
    expect(TokenUtils.storeRefreshToken).toHaveBeenCalledWith(
      prisma,
      mockTokens.refresh,
      mockUser.id,
      req.clientMeta
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      mockTokens.refresh,
      {
        httpOnly: true,
        secure: env.NODE_ENV == 'production',
        sameSite: 'strict',
        maxAge: tokenExpirations.REFRESH_TOKEN_EXPIRY_MS,
        path: '/api/auth/refresh',
      }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Login successful',
      data: { tokens: { access: mockTokens.access } },
    });
  });

  it('should throw if otp is invalid', async () => {
    vi.spyOn(OtpService, 'verifyOtp').mockRejectedValue(
      new HttpError({
        status: 401,
        code: CommonErrorCode.UNAUTHORIZED,
        message: '',
      })
    );

    vi.spyOn(JwtUtils, 'verifyTfaToken').mockReturnValue(
      mockTokenPayload as TfaPayload
    );

    await verifyOtpController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should throw if token is invalid', async () => {
    vi.spyOn(OtpService, 'verifyOtp').mockResolvedValue();
    vi.spyOn(JwtUtils, 'verifyTfaToken').mockRejectedValue(
      new HttpError({
        status: 500,
        code: CommonErrorCode.INTERNAL_SERVER_ERROR,
        message: '',
      })
    );

    await verifyOtpController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
