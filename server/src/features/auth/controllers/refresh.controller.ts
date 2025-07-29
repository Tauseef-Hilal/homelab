import { Request, Response } from 'express';
import { catchAsync } from '@/lib/catchAsync';
import * as AuthService from '../services/auth.service';
import { authConfig } from '../auth.config';
import { env } from '@/config/env';
import { throwUnauthorized } from '../utils/error.util';

export const refreshController = catchAsync(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw throwUnauthorized('Missing refresh token');
    }

    const { tokens } = await AuthService.refreshTokens(
      refreshToken,
      req.clientMeta ?? {}
    );

    return res
      .status(201)
      .cookie('refreshToken', tokens.refresh, {
        httpOnly: true,
        secure: env.NODE_ENV == 'production',
        sameSite: 'strict',
        maxAge: authConfig.REFRESH_TOKEN_EXPIRY_MS,
        path: '/api/auth/refresh',
      })
      .json({
        success: true,
        data: { tokens: { access: tokens.access } },
      });
  }
);
