import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { listDirectorySchema } from '@shared/schemas/storage/request.schema';
import { listDirectory } from '../services/folder.service';
import { success } from '@server/lib/response';

export const listController = catchAsync(
  async (req: Request, res: Response) => {
    const { path } = listDirectorySchema.parse(req.query);
    const folder = await listDirectory(req.user?.id, path);

    res.status(200).json(success({ folder }));
  }
);
