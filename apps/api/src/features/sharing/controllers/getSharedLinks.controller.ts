import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { getSharedLinks } from '../services/sharing.service';
import { success } from '@server/lib/response';

export const getSharedLinksController = catchAsync(
  async (req: Request, res: Response) => {
    const { itemId } = req.params;

    const links = await getSharedLinks(req.user.id, itemId);

    return res
      .status(200)
      .json(success({ links }, 'Shared links retrieved successfully'));
  },
);
