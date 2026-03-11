import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { success } from '@server/lib/response';
import { enqueueZipJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@homelab/shared/jobs';
import { requestSchemas } from '@homelab/shared/schemas/storage';

export const downloadItemsController = catchAsync(
  async (req: Request, res: Response) => {
    const { items } = requestSchemas.downloadItemsSchema.parse(req.body);
    const job = await enqueueZipJob(jobNames.zipJobName, {
      items,
      userId: req.user.id,
      requestId: req.id,
      prismaJobId: '',
    });

    res.status(203).json(success({ job }, 'Preparing zip for download'));
  },
);
