import { catchAsync } from '@/lib/catchAsync';
import { Request, Response } from 'express';
import { renameFile } from '../services/storage.service';
import { fileIdParamSchema, renameFileSchema } from '../schemas/storage.schema';

export const renameFileController = catchAsync(
  async (req: Request, res: Response) => {
    const fileId = fileIdParamSchema.parse(req.params.fileId);
    const { newName } = renameFileSchema.parse(req.body);

    await renameFile(req.user.id, fileId, newName);

    return res
      .status(200)
      .json({ success: true, message: 'File renamed successfully' });
  }
);
