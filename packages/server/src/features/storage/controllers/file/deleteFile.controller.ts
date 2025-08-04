import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { fileIdParamSchema } from '../../schemas/file.schema';
import { deleteFile } from '../../services/file.service';

export const deleteFileController = catchAsync(
  async (req: Request, res: Response) => {
    const fileId = fileIdParamSchema.parse(req.params.fileId);
    await deleteFile(req.user.id, fileId);
    return res.status(204).end();
  }
);
