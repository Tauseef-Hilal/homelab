import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '@/config/env';
import { errorHandler } from '@/middleware/error.middleware';
import * as AuthService from '@/features/auth/services/auth.service';
import { refreshController } from '@/features/auth/controllers/refresh.controller';
import { tokenExpirations } from '@/constants/token.constants';

describe('refreshController', () => {
  const mockTokens = { access: 'access-token', refresh: 'refresh-token' };
  const mockOldToken = 'old-token';

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
      },
      cookies: {
        refreshToken: mockOldToken,
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

    vi.spyOn(AuthService, 'refreshTokens').mockResolvedValue({
      tokens: mockTokens,
    });
  });

  it('should successfully refresh tokens', async () => {
    await refreshController(req, res, next);

    expect(AuthService.refreshTokens).toHaveBeenCalledWith(
      mockOldToken,
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
      data: { tokens: { access: mockTokens.access } },
    });
  });

  it('should throw if refresh token is missing', async () => {
    const invalidReq = { ...req, cookies: {} };
    await refreshController(invalidReq, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
