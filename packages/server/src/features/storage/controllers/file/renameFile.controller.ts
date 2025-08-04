import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { fileIdParamSchema, renameFileSchema } from '../../schemas/file.schema';
import { renameFile } from '../../services/file.service';

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
