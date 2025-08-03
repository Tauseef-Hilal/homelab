import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logoutController } from '@server/features/auth/controllers/logout.controller';
import { env } from '@shared/config/env';
import * as AuthService from '@server/features/auth/services/auth.service';
import * as OtpService from '@server/features/auth/services/otp.service';
import { withRequestId } from '@shared/logging';

describe('logoutController', () => {
  const mockToken = 'refresh-token';

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      id: 'requestId',
      logger: withRequestId('requestId'),
      body: {
        logoutAll: false,
      },
      clientMeta: { ipAddress: '127.0.0.1', userAgent: 'Vitest' },
      cookies: {
        refreshToken: mockToken,
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();

    vi.spyOn(OtpService, 'sendOtp').mockResolvedValue();
    vi.spyOn(AuthService, 'logout').mockResolvedValue();
  });

  it('should logout successfully', async () => {
    await logoutController(req, res, next);

    expect(AuthService.logout).toHaveBeenCalledWith(
      mockToken,
      req.clientMeta,
      req.body.logoutAll
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV == 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Logged out successfully',
    });
  });
});
