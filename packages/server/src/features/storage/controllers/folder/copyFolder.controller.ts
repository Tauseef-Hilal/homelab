import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import {
  copyFolderSchema,
  folderIdParamSchema,
} from '../../schemas/folder.schema';
import { copyFolder } from '../../services/folder.service';

export const copyFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const folderId = folderIdParamSchema.parse(req.params.folderId);
    const { targetFolderId } = copyFolderSchema.parse(req.body);

    await copyFolder(req.user.id, folderId, targetFolderId);

    res
      .status(200)
      .json({ success: true, message: 'Folder copied successfully' });
  }
);
