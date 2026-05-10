import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { listDirectory } from '../services/storage.service';
import { success } from '@server/lib/response';

export const listDirectoryController = catchAsync(
  async (req: Request, res: Response) => {
    const { path, ownerId, shareToken } =
      requestSchemas.listDirectorySchema.parse(req.query);

    const folder = await listDirectory(req.user?.id, shareToken, path, ownerId);

    res.status(200).json(success({ folder }));
  },
);
