import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { getUserShares } from '../services/sharing.service';
import { success } from '@server/lib/response';

export const getUserSharesController = catchAsync(
  async (req: Request, res: Response) => {
    const { itemId } = req.params;

    const shares = await getUserShares(req.user.id, itemId);

    return res
      .status(200)
      .json(success({ shares }, 'User shares retrieved successfully'));
  },
);
