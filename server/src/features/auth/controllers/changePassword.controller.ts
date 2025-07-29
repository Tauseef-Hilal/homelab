import { Request, Response } from 'express';
import { catchAsync } from '@/lib/catchAsync';
import { changePasswordSchema } from '../schemas/auth.schema';
import * as AuthService from '../services/auth.service';
import redis from '@/lib/redis/redis';
import { RedisKeys } from '@/lib/redis/redisKeys';
import { HttpError } from '@/errors/HttpError';
import { AuthErrorCode } from '../constants/AuthErrorCode';

export const changePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const canProceed = await redis.get(
      RedisKeys.auth.allowPasswordChange(req.user?.id ?? '')
    );

    if (!canProceed) {
      throw new HttpError({
        status: 403,
        code: AuthErrorCode.OTP_VERIFICATION_REQUIRED,
        message: 'OTP verification required to change password',
      });
    }

    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    await AuthService.changePassword(
      req.user?.id ?? '',
      oldPassword,
      newPassword
    );

    return res
      .status(200)
      .json({ success: true, message: 'Password changed successfully' });
  }
);
