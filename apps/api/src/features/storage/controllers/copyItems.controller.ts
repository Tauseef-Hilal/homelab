import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { enqueueCopyJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@homelab/contracts/jobs';
import { success } from '@server/lib/response';
import { CommonErrorCode, HttpError } from '@homelab/contracts/errors';

export const copyItemsController = catchAsync(
  async (req: Request, res: Response) => {
    const { destinationFolderId, items } = requestSchemas.copyItemsSchema.parse(
      req.body,
    );

    const idempotencyKey = req.header('x-idempotency-key');

    if (!idempotencyKey) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'Header x-idempotency-key required',
      });
    }

    const job = await enqueueCopyJob(
      jobNames.copyJobName,
      {
        items,
        destFolderId: destinationFolderId,
        requestId: req.id,
        userId: req.user.id,
      },
      idempotencyKey,
    );

    res
      .status(200)
      .json(success({ job: { id: job.id } }, 'Copying items in progress'));
  },
);
