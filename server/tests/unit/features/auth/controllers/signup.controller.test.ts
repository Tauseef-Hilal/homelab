import * as AuthService from '@/features/auth/services/auth.service';
import { authConfig } from '@/features/auth/auth.config';
import { env } from '@/config/env';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { User } from '@prisma/client';
import { signupController } from '@/features/auth/controllers/signup.controller';

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
      req.clientMeta
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      mockTokens.refresh,
      {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: authConfig.REFRESH_TOKEN_EXPIRY_MS,
        path: '/api/auth/refresh',
      }
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        user: mockUser,
        tokens: {
          access: mockTokens.access,
        },
      },
    });
  });
});
