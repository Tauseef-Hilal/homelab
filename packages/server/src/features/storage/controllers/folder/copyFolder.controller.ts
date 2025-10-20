import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import {
  copyFolderSchema,
  idParamSchema,
} from '../../../../../../shared/src/schemas/storage/request/folder.schema';
import { copyFolder } from '../../services/folder.service';
import { success } from '@server/lib/response';
import { enqueueCopyJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@shared/jobs/constants';

export const copyFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const folderId = idParamSchema.parse(req.params.folderId);
    const { targetFolderId } = copyFolderSchema.parse(req.body);

    const jobPayload = await copyFolder(req.user.id, folderId, targetFolderId);

    const job = await enqueueCopyJob(jobNames.copyJobName, {
      ...jobPayload,
      requestId: req.id,
      prismaJobId: '',
    });

    res.status(203).json(success({ job }, 'Folder will be copied shortly'));
  }
);
