import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { success } from '@server/lib/response';
import { revokeLink } from '../services/sharing.service';

export const revokeLinkController = catchAsync(
  async (req: Request, res: Response) => {
    const { token } = req.params;

    await revokeLink(req.user.id, token);

    return res.status(200).json(success({}, 'Share link revoked successfully'));
  },
);
