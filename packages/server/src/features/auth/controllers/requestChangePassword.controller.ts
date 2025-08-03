import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestChangePasswordSchema } from '../schemas/auth.schema';
import { allowPasswordChange } from '../services/auth.service';

export const requestChangePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = requestChangePasswordSchema.parse(req.body);
    const token = await allowPasswordChange(email);

    return res.status(200).json({
      success: true,
      token,
      message: token ? 'OTP sent!' : 'OTP already sent!',
    });
  }
);
