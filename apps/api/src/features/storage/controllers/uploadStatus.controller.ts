import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { success } from '@server/lib/response';
import { getUploadStatus } from '../services/upload.service';

export const uploadStatusController = catchAsync(
  async (req: Request, res: Response) => {
    const { uploadId } = requestSchemas.uploadStatusSchema.parse(req.body);
    const result = await getUploadStatus(req.user.id, uploadId);
    return res.status(201).json(success(result));
  },
);
