import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { shareWithUser } from '../services/sharing.service';
import { success } from '@server/lib/response';

export const updateUserShareController = catchAsync(
  async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { userEmail, permissions } =
      await requestSchemas.updateUserShareSchema.parseAsync(req.body);

    await shareWithUser(req.user.id, userEmail, itemId, permissions);
    return res.status(200).json(success({}, 'Permissions updated for user'));
  },
);
