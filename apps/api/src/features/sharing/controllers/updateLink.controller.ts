import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { catchAsync } from '@server/lib/catchAsync';
import { success } from '@server/lib/response';
import { updateLink } from '../services/sharing.service';

export const updateLinkController = catchAsync(
  async (req: Request, res: Response) => {
    const { token } = req.params;
    const { permissions, expiry } =
      await requestSchemas.updateLinkSchema.parseAsync(req.body);

    await updateLink(req.user.id, token, permissions, expiry);

    return res.status(200).json(success({}, 'Share link updated successfully'));
  },
);
