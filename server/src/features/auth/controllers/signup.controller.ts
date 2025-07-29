import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '@/lib/catchAsync';
import { signupSchema } from '../schemas/auth.schema';
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
