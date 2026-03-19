import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestSchemas } from '@homelab/contracts/schemas/auth';
import { success } from '@server/lib/response';
import { verifyTfaToken } from '@server/lib/jwt';
import * as AuthService from '../services/auth.service';

export const changePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { token, newPassword } = requestSchemas.changePasswordSchema.parse(
      req.body
    );

    const { email } = verifyTfaToken(token);

    await AuthService.changePassword(email, newPassword);

    return res.status(200).json(success({}, 'Password changed successfully'));
  }
);
