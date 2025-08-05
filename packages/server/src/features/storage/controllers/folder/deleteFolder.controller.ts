import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { idParamSchema } from '../../schemas/folder.schema';
import { deleteFolder } from '../../services/folder.service';

export const deleteFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const folderId = idParamSchema.parse(req.params.folderId);
    await deleteFolder(req.user.id, folderId);
    res.status(204).end();
  }
);
