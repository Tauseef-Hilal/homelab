import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { getLinkItem } from '../services/storage.service';
import { success } from '@server/lib/response';

export const getLinkItemController = catchAsync(
  async (req: Request, res: Response) => {
    const { shareToken } = await requestSchemas.getLinkItemSchema.parseAsync(
      req.query,
    );

    const item = await getLinkItem(shareToken);
    res.status(200).json(success(item));
  },
);
