import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '@/lib/catchAsync';
import { loginSchema } from '../schemas/auth.schema';
import * as AuthService from '../services/auth.service';
import * as OtpService from '../services/otp.service';

export const loginController = catchAsync(
  async (req: Request, res: Response, _: NextFunction) => {
    const { email, password } = loginSchema.parse(req.body);

    const { token, user } = await AuthService.login(
      email,
      password,
      req.clientMeta ?? {}
    );

    await OtpService.sendOtp(user.id, user.email);

    return res
      .status(200)
      .json({ success: true, message: 'Verify OTP to login', token });
  }
);
