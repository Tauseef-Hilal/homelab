import { requestSchemas } from '@homelab/contracts/schemas/sharing';
import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { shareWithUser } from '../services/sharing.service';
import { success } from '@server/lib/response';

export const shareWithUserContoller = catchAsync(
  async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { userEmail, permissions } =
      await requestSchemas.shareWithUserSchema.parseAsync(req.body);

    await shareWithUser(req.user.id, userEmail, itemId, permissions);
    return res.status(201).json(success({}, 'File shared with user'));
  },
);
