import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@homelab/db/prisma';
import { User } from '@prisma/client';
import { env } from '@homelab/infra/config';
import { HttpError, CommonErrorCode } from '@homelab/contracts/errors';
import { errorHandler } from '@server/middleware/error.middleware';
import { TfaPurpose } from '@server/features/auth/constants/TfaPurpose';
import { TfaPayload } from '@server/types/jwt.types';
import { verifyOtpController } from '@server/features/auth/controllers/verifyOtp.controller';
import { tokenExpirations } from '@server/constants/token.constants';
import { loggerWithContext } from '@homelab/infra/logging';
import { success } from '@server/lib/response';
import * as AuthService from '@server/features/auth/services/auth.service';
import * as OtpService from '@server/features/auth/services/otp.service';
import * as JwtUtils from '@server/lib/jwt';
import * as TokenUtils from '@server/features/auth/utils/token.util';

vi.mock('@server/lib/logger');
vi.mock('@homelab/db/prisma');
vi.mock('@server/features/auth/services/auth.service');
vi.mock('@server/features/auth/services/otp.service');
vi.mock('@server/lib/jwt');
vi.mock('@server/features/auth/utils/token.util');

describe('verifyOtpController', () => {
  const mockOtp = '123456';
  const mockToken = 'tfa-token';
  const mockTokens = { access: 'access-token', refresh: 'refresh-token' };
  const mockTokenPayload = {
    userId: 'user-123',
    email: 'user@example.com',
    purpose: TfaPurpose.CHANGE_PASSWORD,
  };
  const mockUser = { id: 'user-123', email: 'user@example.com', role: 'USER' };

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      id: 'requestId',
      logger: loggerWithContext({ requestId: 'requestId' }),
      body: {
        token: mockToken,
        otp: mockOtp,
      },
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

    vi.spyOn(AuthService, 'allowPasswordChange').mockResolvedValue(mockToken);
  });

  it('should verify OTP and allow password change', async () => {
    vi.spyOn(OtpService, 'verifyOtp').mockResolvedValue();
    vi.spyOn(JwtUtils, 'verifyTfaToken').mockReturnValue(
      mockTokenPayload as TfaPayload,
    );

    await verifyOtpController(req, res, next);
    expect(OtpService.verifyOtp).toHaveBeenCalledWith(
      mockTokenPayload.userId,
      mockOtp,
    );
    expect(next).not.toHaveBeenCalled();
    expect(AuthService.allowPasswordChange).toHaveBeenCalledWith(
      mockTokenPayload.email,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      success(
        { changePasswordToken: mockToken },
        'Continue to change password',
      ),
    );
  });

  it('should verify OTP and login user', async () => {
    const payload = { ...mockTokenPayload, purpose: TfaPurpose.LOGIN };

    vi.spyOn(OtpService, 'verifyOtp').mockResolvedValue();
    vi.spyOn(TokenUtils, 'storeRefreshToken').mockResolvedValue();
    vi.spyOn(JwtUtils, 'generateAccessToken').mockReturnValue(
      mockTokens.access,
    );
    vi.spyOn(JwtUtils, 'generateRefreshToken').mockReturnValue(
      mockTokens.refresh,
    );
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as User);
    vi.spyOn(JwtUtils, 'verifyTfaToken').mockReturnValue(payload as TfaPayload);

    await verifyOtpController(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(OtpService.verifyOtp).toHaveBeenCalledWith(payload.userId, mockOtp);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: payload.email },
    });
    expect(JwtUtils.generateAccessToken).toHaveBeenCalled();
    expect(JwtUtils.generateRefreshToken).toHaveBeenCalled();
    expect(TokenUtils.storeRefreshToken).toHaveBeenCalledWith(
      prisma,
      mockTokens.refresh,
      mockUser.id,
      req.clientMeta,
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      mockTokens.refresh,
      {
        httpOnly: true,
        secure: env.NODE_ENV == 'production',
        sameSite: env.NODE_ENV == 'production' ? 'none' : 'lax',
        maxAge: tokenExpirations.REFRESH_TOKEN_EXPIRY_MS,
      },
    );
    expect(res.json).toHaveBeenCalledWith(
      success(
        {
          user: mockUser,
          tokens: { access: mockTokens.access },
        },
        'Login successful',
      ),
    );
  });

  it('should throw if otp is invalid', async () => {
    vi.spyOn(OtpService, 'verifyOtp').mockRejectedValue(
      new HttpError({
        status: 401,
        code: CommonErrorCode.UNAUTHORIZED,
        message: '',
      }),
    );

    vi.spyOn(JwtUtils, 'verifyTfaToken').mockReturnValue(
      mockTokenPayload as TfaPayload,
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
      }),
    );

    await verifyOtpController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
