import { Request, Response } from 'express';
import { catchAsync } from '@/lib/catchAsync';
import { loginSchema } from '../schemas/auth.schema';
import * as AuthService from '../services/auth.service';
import * as OtpService from '../services/otp.service';
import { generateTfaToken } from '../utils/jwt.util';
import { TfaPurpose } from '../constants/TfaPurpose';

export const loginController = catchAsync(
  async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    await AuthService.login(email, password, req.clientMeta ?? {});
    await OtpService.sendOtp(req.user.id, req.user.email);

    const token = generateTfaToken({
      userId: req.user?.id ?? '',
      purpose: TfaPurpose.LOGIN,
      createdAt: Date.now(),
    });

    return res
      .status(200)
      .json({ success: true, message: 'Verify OTP to login', token });
  }
);
