import { catchAsync } from '@/lib/catchAsync';
import { Request, Response } from 'express';
import { renameFileSchema } from '../schemas/storage.schema';
import { renameFile } from '../services/storage.service';

export const renameFileController = catchAsync(
  async (req: Request, res: Response) => {
    const { fileId, newName } = renameFileSchema.parse(req.body);
    await renameFile(req.user.id, fileId, newName);
    return res
      .status(200)
      .json({ success: true, message: 'File renamed successfully' });
  }
);
