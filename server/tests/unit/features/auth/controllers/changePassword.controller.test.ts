import redis from '@/lib/redis/redis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '@/middleware/error.middleware';
import * as AuthService from '@/features/auth/services/auth.service';
import { changePasswordController } from '@/features/auth/controllers/changePassword.controller';

describe('changePasswordController', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      user: {
        id: 'user-123',
      },
      body: {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      },
      clientMeta: { ipAddress: '127.0.0.1', userAgent: 'Vitest' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn().mockImplementation((err) => {
      errorHandler(err, req, res, next);
    });

    vi.spyOn(AuthService, 'changePassword').mockResolvedValue();
  });

  it('should throw if user has not verified OTP', async () => {
    vi.spyOn(redis, 'get').mockResolvedValue(null);

    await changePasswordController(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should successfully change password if user has verified OTP', async () => {
    vi.spyOn(redis, 'get').mockResolvedValue('true');

    await changePasswordController(req, res, next);

    expect(AuthService.changePassword).toHaveBeenCalledWith(
      req.user.id,
      req.body.oldPassword,
      req.body.newPassword
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Password changed successfully',
    });
  });
});
