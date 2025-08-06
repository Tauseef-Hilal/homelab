import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { copyFileSchema, fileIdParamSchema } from '../../schemas/file.schema';
import { copyFile } from '../../services/file.service';
import { success } from '@server/lib/response';

export const copyFileController = catchAsync(
  async (req: Request, res: Response) => {
    const fileId = fileIdParamSchema.parse(req.params.fileId);
    const { targetFolderId } = copyFileSchema.parse(req.body);

    await copyFile(req.user.id, fileId, targetFolderId);

    return res.status(200).json(success({}, 'File copied successfully'));
  }
);
