import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { success } from '@server/lib/response';
import { enqueueZipJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@shared/jobs/constants';
import { downloadItemsSchema } from '@shared/schemas/storage/request.schema';

export const downloadItemsController = catchAsync(
  async (req: Request, res: Response) => {
    const { items } = downloadItemsSchema.parse(req.body);
    const job = await enqueueZipJob(jobNames.zipJobName, {
      items,
      userId: req.user.id,
      requestId: req.id,
      prismaJobId: '',
    });

    res.status(203).json(success({ job }, 'Preparing zip for download'));
  }
);
