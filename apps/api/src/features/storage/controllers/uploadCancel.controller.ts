import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { success } from '@server/lib/response';
import { CommonErrorCode, HttpError } from '@homelab/contracts/errors';
import { cancelUpload } from '../services/upload.service';

export const uploadCancelController = catchAsync(
  async (req: Request, res: Response) => {
    const { uploadId } = requestSchemas.uploadCancelSchema.parse(req.body);
    const idempotencyKey = req.header('x-idempotency-key');

    if (!idempotencyKey) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'Header x-idempotency-key required',
      });
    }

    await cancelUpload(req.user.id, uploadId, req.id, idempotencyKey);
    return res.status(200).json(success({}, 'Upload cancelled'));
  },
);
