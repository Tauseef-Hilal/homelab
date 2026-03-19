import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { createFolder } from '../services/folder.service';
import { success } from '@server/lib/response';

export const createFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const { folderName, parentId } = requestSchemas.createFolderSchema.parse(req.body);
    const folder = await createFolder(req.user.id, folderName, parentId);

    res.status(201).json(success({ folder }, 'Folder created successfully'));
  }
);
