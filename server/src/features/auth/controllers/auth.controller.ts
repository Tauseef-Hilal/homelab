import { Request, Response } from 'express';
import { catchAsync } from '@/lib/catchAsync';
import { changePasswordSchema, loginSchema, signupSchema } from '../schemas/auth.schema';
import * as AuthService from '../services/auth.service';
import { authConfig } from '../auth.config';
import { env } from '@/config/env';

export const signupController = catchAsync(
  async (req: Request, res: Response) => {
    const { username, email, password } = signupSchema.parse(req.body);
    const { user, tokens } = await AuthService.signup(
      username,
      email,
      password,
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
        data: { user, tokens: { access: tokens.access } },
      });
  }
);

export const loginController = catchAsync(
  async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    const { tokens } = await AuthService.login(
      email,
      password,
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

export const changePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    await AuthService.changePassword(
      req.user?.id ?? '',
      oldPassword,
      newPassword
    );

    return res
      .status(200)
      .json({ success: true, message: 'Passoword changed successfully' });
  }
);

export const refreshController = catchAsync(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
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
