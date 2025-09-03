import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestChangePasswordSchema } from '@shared/schemas/auth/request/auth.schema';
import { allowPasswordChange } from '../services/auth.service';
import { success } from '@server/lib/response';

export const requestChangePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = requestChangePasswordSchema.parse(req.body);
    const token = await allowPasswordChange(email);

    return res
      .status(200)
      .json(success({ token }, token ? 'OTP sent!' : 'OTP already sent!'));
  }
);
