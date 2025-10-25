import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import * as AuthService from '../services/auth.service';
import { env } from '@shared/config/env';
import { throwUnauthorized } from '../utils/error.util';
import { tokenExpirations } from '@server/constants/token.constants';
import { success } from '@server/lib/response';

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
        sameSite: env.NODE_ENV == 'production' ? 'none' : 'lax',
        maxAge: tokenExpirations.REFRESH_TOKEN_EXPIRY_MS,
      })
      .json(success({ tokens: { access: tokens.access } }));
  }
);
