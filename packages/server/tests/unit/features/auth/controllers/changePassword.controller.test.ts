import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '@server/middleware/error.middleware';
import { changePasswordController } from '@server/features/auth/controllers/changePassword.controller';
import { loggerWithContext } from '@homelab/shared/logging';
import { AuthErrorCode } from '@server/features/auth/constants/AuthErrorCode';
import { HttpError } from '@homelab/shared/errors';
import { TfaPayload } from '@server/types/jwt.types';
import * as AuthService from '@server/features/auth/services/auth.service';
import * as Jwt from '@server/lib/jwt';
import { success } from '@server/lib/response';

vi.mock('@server/features/auth/services/auth.service');
vi.mock('@server/lib/jwt');

describe('changePasswordController', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      id: 'requestId',
      logger: loggerWithContext({ requestId: 'requestId' }),
      body: {
        token: 'asdf-as-dfsad-fsa-df-sa',
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
    vi.spyOn(Jwt, 'verifyTfaToken').mockResolvedValue({} as TfaPayload);
    vi.spyOn(AuthService, 'changePassword').mockRejectedValue(
      new HttpError({
        status: 403,
        code: AuthErrorCode.OTP_VERIFICATION_REQUIRED,
        message: 'OTP verification required to change password',
      }),
    );

    await changePasswordController(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should successfully change password if user has verified OTP', async () => {
    const mockEmail = 'email@example.com';
    vi.spyOn(Jwt, 'verifyTfaToken').mockReturnValue({
      email: mockEmail,
    } as TfaPayload);
    vi.spyOn(AuthService, 'changePassword').mockResolvedValue();

    await changePasswordController(req, res, next);

    expect(AuthService.changePassword).toHaveBeenCalledWith(
      mockEmail,
      req.body.newPassword,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      success({}, 'Password changed successfully'),
    );
  });
});
