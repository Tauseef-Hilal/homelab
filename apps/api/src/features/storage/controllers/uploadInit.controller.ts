import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { success } from '@server/lib/response';
import { initUpload } from '../services/upload.service';
import { CommonErrorCode, HttpError } from '@homelab/contracts/errors';

export const uploadInitController = catchAsync(
  async (req: Request, res: Response) => {
    const initUploadInput = requestSchemas.uploadInitSchema.parse(req.body);
    const idempotencyKey = req.header('x-idempotency-key');

    if (!idempotencyKey) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'Header x-idempotency-key required',
      });
    }

    const result = await initUpload(req.user.id, {
      ...initUploadInput,
      uploadId: idempotencyKey,
    });
    return res.status(201).json(success(result));
  },
);
