import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { success } from '@server/lib/response';
import { listSharedItems } from '../services/storage.service';

export const listSharedItemsController = catchAsync(
  async (req: Request, res: Response) => {
    const items = await listSharedItems(req.user?.id);
    res.status(200).json(success(items));
  },
);
