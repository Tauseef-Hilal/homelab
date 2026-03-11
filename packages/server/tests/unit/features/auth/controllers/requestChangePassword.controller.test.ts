import { redis, RedisKeys } from '@homelab/shared/redis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '@server/middleware/error.middleware';
import { authConfig } from '@server/features/auth/auth.config';
import { TfaPurpose } from '@server/features/auth/constants/TfaPurpose';
import { requestChangePasswordController } from '@server/features/auth/controllers/requestChangePassword.controller';
import { loggerWithContext } from '@homelab/shared/logging';
import * as AuthService from '@server/features/auth/services/auth.service';
import { success } from '@server/lib/response';

vi.mock('@server/features/auth/services/auth.service');

describe('requestChangePasswordController', () => {
  const mockToken = 'tfa-token';
  const mockUser = { id: 'user123', email: 'user@example.com' };

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      id: 'requestId',
      logger: loggerWithContext({ requestId: 'requestId' }),
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

  });

  const cases = [
    {
      expiresAt: String(Date.now() - 10000),
      label: 'previous OTP expired',
    },
    { expiresAt: null, label: 'no OTP sent previously' },
  ];

  it.each(cases)('should send OTP if $label', async ({ expiresAt }) => {
    vi.spyOn(AuthService, 'allowPasswordChange').mockResolvedValue(mockToken);

    await requestChangePasswordController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      success({ token: mockToken }, 'OTP sent!'),
    );
  });
});
