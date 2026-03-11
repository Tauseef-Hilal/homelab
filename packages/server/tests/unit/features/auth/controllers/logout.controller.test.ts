import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '@homelab/shared/config';
import { logoutController } from '@server/features/auth/controllers/logout.controller';
import { loggerWithContext } from '@homelab/shared/logging';
import * as AuthService from '@server/features/auth/services/auth.service';
import { success } from '@server/lib/response';

vi.mock('@server/features/auth/services/auth.service');

describe('logoutController', () => {
  const mockToken = 'refresh-token';

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      id: 'requestId',
      logger: loggerWithContext({ requestId: 'requestId' }),
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
  });

  it('should logout successfully', async () => {
    await logoutController(req, res, next);

    expect(AuthService.logout).toHaveBeenCalledWith(
      req.cookies.refreshToken,
      req.clientMeta,
      req.body.logoutAll,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV == 'production',
      sameSite: env.NODE_ENV == 'production' ? 'none' : 'lax',
    });
    expect(res.json).toHaveBeenCalledWith(
      success({}, 'Logged out successfully'),
    );
  });
});
