import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { env } from '@shared/config/env';
import * as AuthService from '../services/auth.service';
import { success } from '@server/lib/response';

export const logoutController = catchAsync(
  async (req: Request, res: Response) => {
    const { logoutAll } = req.body;
    const refreshToken = req.cookies.refreshToken;

    await AuthService.logout(refreshToken, req.clientMeta ?? {}, logoutAll);

    return res
      .status(200)
      .clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV == 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh',
      })
      .json(success({}, 'Logged out successfully'));
  }
);
