import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { createFolderSchema } from '../../schemas/folder.schema';
import { createFolder } from '../../services/folder.service';

export const createFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const { folderName, parentId } = createFolderSchema.parse(req.body);
    const folder = await createFolder(req.user.id, folderName, parentId);

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      folder,
    });
  }
);
