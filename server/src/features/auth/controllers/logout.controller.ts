import { Request, Response } from 'express';
import { catchAsync } from '@/lib/catchAsync';
import { env } from '@/config/env';
import * as AuthService from '../services/auth.service';

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
      .json({ success: true, message: 'Logged out successfully' });
  }
);
