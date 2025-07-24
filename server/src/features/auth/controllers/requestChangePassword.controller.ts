import { Request, Response } from 'express';
import { catchAsync } from '@/lib/catchAsync';
import * as OtpService from '../services/otp.service';
import redis from '@/lib/redis/redis';
import { RedisKeys } from '@/lib/redis/redisKeys';
import { generateTfaToken } from '../utils/jwt.util';
import { TfaPurpose } from '../constants/TfaPurpose';
import { authConfig } from '../auth.config';

export const requestChangePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const existing = await redis.get(
      RedisKeys.auth.allowPasswordChange(req.user?.id ?? '')
    );

    if (existing && Number(existing) > Date.now()) {
      return res
        .status(200)
        .json({ success: true, message: 'OTP already sent' });
    }

    await OtpService.sendOtp(req.user.id, req.user.email);

    const expiresAt = String(
      Date.now() + authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS * 1000
    );

    await redis.set(
      RedisKeys.auth.allowPasswordChange(req.user.id),
      expiresAt,
      'EX',
      authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS
    );

    const token = generateTfaToken({
      userId: req.user?.id ?? '',
      purpose: TfaPurpose.CHANGE_PASSWORD,
      createdAt: Date.now(),
    });

    return res.status(200).json({ success: true, token });
  }
);
