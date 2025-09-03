import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { signupSchema } from '@shared/schemas/auth/request/auth.schema';
import * as AuthService from '../services/auth.service';
import { env } from '@shared/config/env';
import { tokenExpirations } from '@server/constants/token.constants';
import { success } from '@server/lib/response';

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
        sameSite: 'none',
        maxAge: tokenExpirations.REFRESH_TOKEN_EXPIRY_MS,
      })
      .json(
        success(
          {
            user: {
              id: user.id,
              role: user.role,
              email: user.email,
              username: user.username,
            },
            tokens: { access: tokens.access },
          },
          'Signup successful'
        )
      );
  }
);
