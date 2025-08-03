import redis from '@shared/redis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '@server/middleware/error.middleware';
import * as AuthService from '@server/features/auth/services/auth.service';
import { changePasswordController } from '@server/features/auth/controllers/changePassword.controller';
import { withRequestId } from '@shared/logging';
import { AuthErrorCode } from '@server/features/auth/constants/AuthErrorCode';
import { HttpError } from '@server/errors/HttpError';

describe('changePasswordController', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      id: 'requestId',
      logger: withRequestId('requestId'),
      body: {
        email: 'user@example.com',
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
  });

  it('should throw if user has not verified OTP', async () => {
    vi.spyOn(redis, 'get').mockResolvedValue(null);
    vi.spyOn(AuthService, 'changePassword').mockRejectedValue(
      new HttpError({
        status: 403,
        code: AuthErrorCode.OTP_VERIFICATION_REQUIRED,
        message: 'OTP verification required to change password',
      })
    );

    await changePasswordController(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should successfully change password if user has verified OTP', async () => {
    vi.spyOn(redis, 'get').mockResolvedValue('true');
    vi.spyOn(AuthService, 'changePassword').mockResolvedValue();

    await changePasswordController(req, res, next);

    expect(AuthService.changePassword).toHaveBeenCalledWith(
      req.body.email,
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
