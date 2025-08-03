import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { changePasswordSchema } from '../schemas/auth.schema';
import * as AuthService from '../services/auth.service';
import redis from '@shared/redis';
import { RedisKeys } from '@shared/redis/redisKeys';
import { HttpError } from '@server/errors/HttpError';
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
