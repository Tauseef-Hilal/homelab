import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { moveFile } from '../../services/file.service';
import {
  fileIdParamSchema,
  moveFileSchema,
} from '../../../../../../shared/src/schemas/storage/request/file.schema';
import { success } from '@server/lib/response';

export const moveFileController = catchAsync(
  async (req: Request, res: Response) => {
    const fileId = fileIdParamSchema.parse(req.params.fileId);
    const { targetFolderId, newFileName } = moveFileSchema.parse(req.body);

    await moveFile(
      req.user.id,
      fileId,
      targetFolderId,
      newFileName === undefined ? null : newFileName
    );

    return res.status(200).json(success({}, 'File moved successfully'));
  }
);
