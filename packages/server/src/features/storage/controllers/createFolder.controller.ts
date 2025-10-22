import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { createFolderSchema } from '@shared/schemas/storage/request.schema';
import { createFolder } from '../services/folder.service';
import { success } from '@server/lib/response';

export const createFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const { folderName, parentId } = createFolderSchema.parse(req.body);
    const folder = await createFolder(req.user.id, folderName, parentId);

    res.status(201).json(success({ folder }, 'Folder created successfully'));
  }
);
