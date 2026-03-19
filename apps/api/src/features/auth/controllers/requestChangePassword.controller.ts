import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestSchemas } from '@homelab/contracts/schemas/auth';

import { allowPasswordChange } from '../services/auth.service';
import { success } from '@server/lib/response';

export const requestChangePasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = requestSchemas.requestChangePasswordSchema.parse(
      req.body,
    );
    const token = await allowPasswordChange(email);

    return res.status(200).json(success({ token }, 'OTP sent!'));
  },
);
