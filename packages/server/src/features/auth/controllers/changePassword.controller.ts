import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { changePasswordSchema } from '../schemas/auth.schema';
import * as AuthService from '../services/auth.service';
import { success } from '@server/lib/response';

export const changePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { email, oldPassword, newPassword } = changePasswordSchema.parse(
      req.body
    );

    await AuthService.changePassword(email, oldPassword, newPassword);

    return res.status(200).json(success({}, 'Password changed successfully'));
  }
);
