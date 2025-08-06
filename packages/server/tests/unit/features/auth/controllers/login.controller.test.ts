import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '@prisma/client';
import { loginController } from '@server/features/auth/controllers/login.controller';
import * as AuthService from '@server/features/auth/services/auth.service';
import * as OtpService from '@server/features/auth/services/otp.service';
import { withRequestId } from '@shared/logging';

describe('loginController', () => {
  const mockUser = { id: '123', email: 'test@example.com' };
  const mockToken = 'tfa-token';

  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      id: 'requestId',
      logger: withRequestId('requestId'),
      body: {
        email: 'test@example.com',
        password: 'Test@12345678',
      },
      clientMeta: { ipAddress: '127.0.0.1', userAgent: 'Vitest' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();

    vi.spyOn(OtpService, 'sendOtp').mockResolvedValue();
    vi.spyOn(AuthService, 'login').mockResolvedValue({
      user: mockUser as User,
      token: mockToken,
    });
  });

  it('should respond with 2fa token', async () => {
    await loginController(req, res, next);

    expect(AuthService.login).toHaveBeenCalledWith(
      req.body.email,
      req.body.password,
      req.clientMeta
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { token: mockToken },
      message: 'Verify OTP to login',
    });
  });
});
