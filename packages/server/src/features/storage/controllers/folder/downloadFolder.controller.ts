import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { idParamSchema } from '../../../../../../shared/src/schemas/storage/request/folder.schema';
import { prepareDownload } from '../../services/folder.service';
import { success } from '@server/lib/response';
import { enqueueZipJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@shared/jobs/constants';

export const downloadFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const folderId = idParamSchema.parse(req.params.folderId);
    const meta = await prepareDownload(req.user.id, folderId);
    const job = await enqueueZipJob(jobNames.zipJobName, {
      ...meta,
      userId: req.user.id,
      requestId: req.id,
      prismaJobId: '',
    });

    res.status(203).json(success({ job }, 'Preparing zip for download'));
  }
);
