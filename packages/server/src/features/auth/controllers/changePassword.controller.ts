import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { changePasswordSchema } from '@shared/schemas/auth/request/auth.schema';
import * as AuthService from '../services/auth.service';
import { success } from '@server/lib/response';
import { verifyTfaToken } from '@server/lib/jwt';

export const changePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { token, newPassword } = changePasswordSchema.parse(
      req.body
    );

    const { email } = verifyTfaToken(token);

    await AuthService.changePassword(email, newPassword);

    return res.status(200).json(success({}, 'Password changed successfully'));
  }
);
