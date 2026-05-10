import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { catchAsync } from '@server/lib/catchAsync';
import { revokeUserShare } from '../services/sharing.service';
import { success } from '@server/lib/response';

export const revokeUserShareController = catchAsync(
  async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { userEmail } = await requestSchemas.revokeUserShareSchema.parseAsync(
      req.body,
    );

    await revokeUserShare(req.user.id, userEmail, itemId);

    return res.status(200).json(success({}, 'User share revoked successfully'));
  },
);
