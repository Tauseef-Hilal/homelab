import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import {
  folderIdParamSchema,
  moveFolderSchema,
} from '../../schemas/folder.schema';
import { moveFolder } from '../../services/folder.service';

export const moveFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const folderId = folderIdParamSchema.parse(req.params.folderId);
    const { targetFolderId, newFolderName } = moveFolderSchema.parse(req.body);

    await moveFolder(
      req.user.id,
      folderId,
      targetFolderId === undefined ? folderId : targetFolderId,
      newFolderName === undefined ? null : newFolderName
    );

    res
      .status(200)
      .json({ success: true, message: 'Folder moved successfully' });
  }
);
