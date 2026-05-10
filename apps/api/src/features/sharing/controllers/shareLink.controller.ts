import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { catchAsync } from '@server/lib/catchAsync';
import { success } from '@server/lib/response';
import { shareLink } from '../services/sharing.service';

export const shareLinkController = catchAsync(
  async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { permissions, expiry } =
      await requestSchemas.shareLinkSchema.parseAsync(req.body);

    const { token } = await shareLink(req.user.id, itemId, permissions, expiry);

    // Returning the token to the frontend so it can construct the full URL
    return res
      .status(201)
      .json(success({ token }, 'Share link generated successfully'));
  },
);
