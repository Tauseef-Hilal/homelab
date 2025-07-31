import redis from '@/lib/redis/redis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '@/middleware/error.middleware';
import { RedisKeys } from '@/lib/redis/redisKeys';
import { authConfig } from '@/features/auth/auth.config';
import { TfaPurpose } from '@/features/auth/constants/TfaPurpose';
import * as AuthService from '@/features/auth/services/auth.service';
import * as OtpService from '@/features/auth/services/otp.service';
import * as jwtUtils from '@/lib/jwt';
import { requestChangePasswordController } from '@/features/auth/controllers/requestChangePassword.controller';

describe('requestChangePasswordController', () => {
  const mockToken = 'tfa-token';

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn().mockImplementation((err) => {
      errorHandler(err, req, res, next);
    });

    vi.spyOn(AuthService, 'allowPasswordChange').mockResolvedValue();
    vi.spyOn(OtpService, 'sendOtp').mockResolvedValue();
    vi.spyOn(redis, 'set').mockResolvedValue('OK');
    vi.spyOn(jwtUtils, 'generateTfaToken').mockReturnValue(mockToken);
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
      req.user.id,
      req.user.email
    );
    expect(redis.set).toHaveBeenCalledWith(
      RedisKeys.auth.allowPasswordChange(req.user.id),
      expect.any(String),
      'EX',
      authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS
    );
    expect(jwtUtils.generateTfaToken).toHaveBeenCalledWith({
      userId: req.user.id,
      purpose: TfaPurpose.CHANGE_PASSWORD,
      createdAt: expect.any(Number),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      token: mockToken,
    });
  });

  it('should not resend OTP if previous OTP has not expired', async () => {
    vi.spyOn(redis, 'get').mockResolvedValue(String(Date.now() + 10000));

    await requestChangePasswordController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'OTP already sent',
    });
  });
});
