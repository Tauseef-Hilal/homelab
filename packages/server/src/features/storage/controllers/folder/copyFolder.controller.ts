import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { copyFolderSchema, idParamSchema } from '../../../../../../shared/src/schemas/storage/request/folder.schema';
import { copyFolder } from '../../services/folder.service';
import { enqueueCopyJob } from '@server/queues/copy.producer';
import { success } from '@server/lib/response';

export const copyFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const folderId = idParamSchema.parse(req.params.folderId);
    const { targetFolderId } = copyFolderSchema.parse(req.body);

    const jobPayload = await copyFolder(req.user.id, folderId, targetFolderId);

    const job = await enqueueCopyJob({
      ...jobPayload,
      requestId: req.id,
      prismaJobId: '',
    });

    res.status(203).json(success({ job }, 'Folder will be copied shortly'));
  }
);
