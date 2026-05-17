import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestSchemas } from '@homelab/contracts/schemas/auth';
import { success } from '@server/lib/response';
import { verifyTfaToken } from '@server/lib/jwt';
import * as AuthService from '../services/auth.service';
import { TfaPurpose } from '../constants/TfaPurpose';
import { HttpError } from '@homelab/contracts/errors';
import { AuthErrorCode } from '../constants/AuthErrorCode';

export const changePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { token, newPassword } = requestSchemas.changePasswordSchema.parse(
      req.body
    );

    const { email, purpose } = verifyTfaToken(token);

    if (purpose !== TfaPurpose.PASSWORD_RESET_AUTHORIZED) {
      throw new HttpError({
        status: 403,
        code: AuthErrorCode.INVALID_TOKEN,
        message: 'Invalid token purpose for password reset',
      });
    }

    await AuthService.changePassword(email, newPassword);

    return res.status(200).json(success({}, 'Password changed successfully'));
  }
);
