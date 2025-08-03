import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { copyFileSchema, fileIdParamSchema } from '../schemas/storage.schema';
import { copyFile } from '../services/storage.service';

export const copyFileController = catchAsync(
  async (req: Request, res: Response) => {
    const fileId = fileIdParamSchema.parse(req.params.fileId);
    const { targetFolderId } = copyFileSchema.parse(req.body);

    await copyFile(req.user.id, fileId, targetFolderId);

    return res
      .status(200)
      .json({ success: true, message: 'File copied successfully' });
  }
);
