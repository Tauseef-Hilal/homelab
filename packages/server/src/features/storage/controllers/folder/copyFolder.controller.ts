import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import {
  copyFolderSchema,
  folderIdParamSchema,
} from '../../schemas/folder.schema';
import { copyFolder } from '../../services/folder.service';
import { CopyJobPayload } from '@shared/queues/copy/copy.types';
import { enqueueCopyJob } from '@server/queues/copy.producer';

export const copyFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const folderId = folderIdParamSchema.parse(req.params.folderId);
    const { targetFolderId } = copyFolderSchema.parse(req.body);

    const jobPayload = (await copyFolder(
      req.user.id,
      folderId,
      targetFolderId
    )) as CopyJobPayload;
    jobPayload.requestId = req.id;

    const job = await enqueueCopyJob(req.id, {
      ...jobPayload,
      prismaJobId: '',
    });

    res
      .status(203)
      .json({ success: true, message: 'Folder will be copied shortly', job });
  }
);
