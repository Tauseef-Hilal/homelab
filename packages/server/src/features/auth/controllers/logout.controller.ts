import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { env } from '@homelab/shared/config';
import { success } from '@server/lib/response';
import { requestSchemas } from '@homelab/shared/schemas/auth';
import * as AuthService from '../services/auth.service';


export const logoutController = catchAsync(
  async (req: Request, res: Response) => {
    const { logoutAll } = requestSchemas.logoutSchema.parse(req.body);
    const refreshToken = req.cookies.refreshToken;

    await AuthService.logout(
      refreshToken,
      req.clientMeta ?? {},
      logoutAll ?? false
    );

    return res
      .status(200)
      .clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV == 'production',
        sameSite: env.NODE_ENV == 'production' ? 'none' : 'lax',
      })
      .json(success({}, 'Logged out successfully'));
  }
);
