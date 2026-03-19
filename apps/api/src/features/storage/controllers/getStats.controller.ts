import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { success } from '@server/lib/response';
import { getStatsForUser } from '@homelab/storage';

export const getStatsController = catchAsync(
  async (req: Request, res: Response) => {
    const stats = await getStatsForUser(req.user.id);
    res.status(200).json(success(stats!));
  },
);
