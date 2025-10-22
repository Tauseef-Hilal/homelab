import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { deleteItemsSchema } from '@shared/schemas/storage/request.schema';
import { enqueueDeleteJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@shared/jobs/constants';
import { success } from '@server/lib/response';

export const deleteItemsController = catchAsync(
  async (req: Request, res: Response) => {
    const { items } = deleteItemsSchema.parse(req.body);

    const job = await enqueueDeleteJob(jobNames.deleteJobName, {
      items,
      prismaJobId: '',
      requestId: req.id,
      userId: req.user.id,
    });

    res
      .status(200)
      .json(success({ job: { id: job.id } }, 'Deleting items in progress'));
  }
);
