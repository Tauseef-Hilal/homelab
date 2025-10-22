import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { moveItemsSchema } from '@shared/schemas/storage/request.schema';
import { enqueueMoveJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@shared/jobs/constants';
import { success } from '@server/lib/response';

export const moveItemsController = catchAsync(
  async (req: Request, res: Response) => {
    const { destinationFolderId, items } = moveItemsSchema.parse(req.body);

    const job = await enqueueMoveJob(jobNames.moveJobName, {
      items,
      destFolderId: destinationFolderId,
      prismaJobId: '',
      requestId: req.id,
      userId: req.user.id,
    });

    res
      .status(200)
      .json(success({ job: { id: job.id } }, 'Moving items in progress'));
  }
);
