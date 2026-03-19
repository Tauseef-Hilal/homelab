import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestSchemas } from '@homelab/contracts/schemas/auth';

import * as AuthService from '../services/auth.service';
import { env } from '@homelab/infra/config';
import { tokenExpirations } from '@server/constants/token.constants';
import { success } from '@server/lib/response';

export const signupController = catchAsync(
  async (req: Request, res: Response) => {
    const { username, email, password } = requestSchemas.signupSchema.parse(
      req.body,
    );
    const { user, tokens } = await AuthService.signup(
      username,
      email,
      password,
      req.clientMeta ?? {},
    );

    return res
      .status(201)
      .cookie('refreshToken', tokens.refresh, {
        httpOnly: true,
        secure: env.NODE_ENV == 'production',
        sameSite: env.NODE_ENV == 'production' ? 'none' : 'lax',
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
          'Signup successful',
        ),
      );
  },
);
