import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import * as StorageService from '../services/storage.service';
import { fileIdParamSchema } from '../schemas/storage.schema';

export const deleteFileController = catchAsync(
  async (req: Request, res: Response) => {
    const fileId = fileIdParamSchema.parse(req.params.fileId);
    await StorageService.deleteFile(req.user.id, fileId);
    return res.status(204).end();
  }
);
