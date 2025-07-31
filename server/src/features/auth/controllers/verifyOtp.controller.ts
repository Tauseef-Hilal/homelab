import { Request, Response } from 'express';
import { catchAsync } from '@/lib/catchAsync';
import { verifyOtpSchema } from '../schemas/auth.schema';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyTfaToken,
} from '../../../lib/jwt';
import * as OtpService from '../services/otp.service';
import * as AuthService from '../services/auth.service';
import { TfaPurpose } from '../constants/TfaPurpose';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/errors/HttpError';
import { AuthErrorCode } from '../constants/AuthErrorCode';
import { buildTokenPayload, storeRefreshToken } from '../utils/token.util';
import { TokenMeta } from '../../../types/jwt.types';
import { env } from '@/config/env';
import { tokenExpirations } from '@/constants/token.constants';

export const verifyOtpController = catchAsync(
  async (req: Request, res: Response) => {
    const { token, otp } = verifyOtpSchema.parse(req.body);
    const { userId, purpose } = verifyTfaToken(token);

    await OtpService.verifyOtp(userId, otp);
    await handleOtpPurpose[purpose](res, userId, req.clientMeta ?? {});
  }
);

const handleOtpPurpose = {
  [TfaPurpose.LOGIN]: async (
    res: Response,
    userId: string,
    meta: TokenMeta
  ) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpError({
        status: 401,
        code: AuthErrorCode.USER_DOES_NOT_EXIST,
        message: 'No user with the given email exists',
      });
    }

    const payload = buildTokenPayload({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await storeRefreshToken(prisma, refreshToken, user.id, meta);

    return res
      .status(201)
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV == 'production',
        sameSite: 'strict',
        maxAge: tokenExpirations.REFRESH_TOKEN_EXPIRY_MS,
        path: '/api/auth/refresh',
      })
      .json({
        success: true,
        message: 'Login successful',
        data: { tokens: { access: accessToken } },
      });
  },

  [TfaPurpose.CHANGE_PASSWORD]: async (res: Response, userId: string) => {
    await AuthService.allowPasswordChange(userId);
    return res
      .status(200)
      .json({ success: true, message: 'Continue to change password' });
  },
};
