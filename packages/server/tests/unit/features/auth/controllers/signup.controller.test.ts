import { env } from '@homelab/shared/config';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { User } from '@prisma/client';
import { signupController } from '@server/features/auth/controllers/signup.controller';
import { tokenExpirations } from '@server/constants/token.constants';
import { loggerWithContext } from '@homelab/shared/logging';
import * as AuthService from '@server/features/auth/services/auth.service';
import { success } from '@server/lib/response';

vi.mock('@server/features/auth/services/auth.service');

describe('signupController', () => {
  const mockUser = { id: '123', email: 'test@example.com' };
  const mockTokens = {
    access: 'access-token',
    refresh: 'refresh-token',
  };

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      id: 'requestId',
      logger: loggerWithContext({ requestId: 'requestId' }),
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@1234',
      },
      clientMeta: { ipAddress: '127.0.0.1', userAgent: 'Vitest' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();

    vi.spyOn(AuthService, 'signup').mockResolvedValue({
      user: mockUser as User,
      tokens: mockTokens,
    });
  });

  it('should respond with user and access token, set refreshToken cookie', async () => {
    await signupController(req, res, next);

    expect(AuthService.signup).toHaveBeenCalledWith(
      req.body.username,
      req.body.email,
      req.body.password,
      req.clientMeta,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      mockTokens.refresh,
      {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
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
        'Signup successful',
      ),
    );
  });
});
