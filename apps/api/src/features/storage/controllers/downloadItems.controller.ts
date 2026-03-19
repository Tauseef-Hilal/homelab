import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { success } from '@server/lib/response';
import { enqueueZipJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@homelab/contracts/jobs';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { CommonErrorCode, HttpError } from '@homelab/contracts/errors';

export const downloadItemsController = catchAsync(
  async (req: Request, res: Response) => {
    const { items } = requestSchemas.downloadItemsSchema.parse(req.body);

    const idempotencyKey = req.header('x-idempotency-key');

    if (!idempotencyKey) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'Header x-idempotency-key required',
      });
    }

    const job = await enqueueZipJob(
      jobNames.zipJobName,
      {
        items,
        userId: req.user.id,
        requestId: req.id,
      },
      idempotencyKey,
    );

    res.status(203).json(success({ job }, 'Preparing zip for download'));
  },
);
