import redis from '@shared/redis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '@server/middleware/error.middleware';
import { RedisKeys } from '@shared/redis/redisKeys';
import { authConfig } from '@server/features/auth/auth.config';
import { TfaPurpose } from '@server/features/auth/constants/TfaPurpose';
import * as AuthService from '@server/features/auth/services/auth.service';
import * as OtpService from '@server/features/auth/services/otp.service';
import * as jwtUtils from '@server/lib/jwt';
import { requestChangePasswordController } from '@server/features/auth/controllers/requestChangePassword.controller';
import { withRequestId } from '@shared/logging';
import { prisma } from '@shared/prisma';
import { User } from '@prisma/client';

describe('requestChangePasswordController', () => {
  const mockToken = 'tfa-token';
  const mockUser = { id: 'user123', email: 'user@example.com' };

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      id: 'requestId',
      logger: withRequestId('requestId'),
      body: {
        email: mockUser.email,
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn().mockImplementation((err) => {
      errorHandler(err, req, res, next);
    });

    vi.spyOn(OtpService, 'sendOtp').mockResolvedValue();
    vi.spyOn(redis, 'set').mockResolvedValue('OK');
    vi.spyOn(jwtUtils, 'generateTfaToken').mockReturnValue(mockToken);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as User);
  });

  const cases = [
    {
      expiresAt: String(Date.now() - 10000),
      label: 'previous OTP expired',
    },
    { expiresAt: null, label: 'no OTP sent previously' },
  ];

  it.each(cases)('should send OTP if $label', async ({ expiresAt }) => {
    vi.spyOn(redis, 'get').mockResolvedValue(expiresAt);

    await requestChangePasswordController(req, res, next);

    expect(OtpService.sendOtp).toHaveBeenCalledWith(
      mockUser.id,
      req.body.email
    );
    expect(redis.set).toHaveBeenCalledWith(
      RedisKeys.auth.allowPasswordChange(mockUser.id),
      expect.any(String),
      'EX',
      authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS
    );
    expect(jwtUtils.generateTfaToken).toHaveBeenCalledWith({
      userId: mockUser.id,
      email: req.body.email,
      purpose: TfaPurpose.CHANGE_PASSWORD,
      createdAt: expect.any(Number),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      message: 'OTP sent!',
      data: { token: mockToken },
    });
  });

  it('should not resend OTP if previous OTP has not expired', async () => {
    vi.spyOn(redis, 'get').mockResolvedValue(String(Date.now() + 10000));
    vi.spyOn(AuthService, 'allowPasswordChange').mockResolvedValue('');

    await requestChangePasswordController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { token: null },
      message: 'OTP already sent!',
    });
  });
});
