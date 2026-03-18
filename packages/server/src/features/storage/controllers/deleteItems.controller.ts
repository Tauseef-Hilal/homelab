import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/shared/schemas/storage';
import { enqueueDeleteJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@homelab/shared/jobs';
import { success } from '@server/lib/response';
import { CommonErrorCode, HttpError } from '@homelab/shared/errors';

export const deleteItemsController = catchAsync(
  async (req: Request, res: Response) => {
    const { items } = requestSchemas.deleteItemsSchema.parse(req.body);

    const idempotencyKey = req.header('x-idempotency-key');

    if (!idempotencyKey) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'Header x-idempotency-key required',
      });
    }

    const job = await enqueueDeleteJob(
      jobNames.deleteJobName,
      {
        items,
        requestId: req.id,
        userId: req.user.id,
      },
      idempotencyKey,
    );

    res
      .status(200)
      .json(success({ job: { id: job.id } }, 'Deleting items in progress'));
  },
);
