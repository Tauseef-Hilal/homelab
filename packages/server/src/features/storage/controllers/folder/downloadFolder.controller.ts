import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { idParamSchema } from '../../schemas/folder.schema';
import { prepareDownload } from '../../services/folder.service';
import { enqueueZipJob } from '@server/queues/zip.producer';

export const downloadFolderController = catchAsync(
  async (req: Request, res: Response) => {
    const folderId = idParamSchema.parse(req.params.folderId);
    const meta = await prepareDownload(req.user.id, folderId);
    const job = await enqueueZipJob(req.id, {
      ...meta,
      userId: req.user.id,
      requestId: req.id,
      prismaJobId: '',
    });

    res.status(203).json({
      success: true,
      message: 'Preparing zip for download',
      job,
    });
  }
);
