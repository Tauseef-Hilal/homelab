import { catchAsync } from '@/lib/catchAsync';
import { Request, Response } from 'express';
import { fileIdParamSchema, moveFileSchema } from '../schemas/storage.schema';
import { moveFile } from '../services/storage.service';

export const moveFileController = catchAsync(
  async (req: Request, res: Response) => {
    const fileId = fileIdParamSchema.parse(req.params.fileId);
    const { targetFolderId } = moveFileSchema.parse(req.body);

    await moveFile(req.user.id, fileId, targetFolderId);

    return res
      .status(200)
      .json({ success: true, message: 'File moved successfully' });
  }
);
