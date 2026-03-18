import { Request, Response } from 'express';
import { catchAsync } from '@server/lib/catchAsync';
import { requestSchemas } from '@homelab/shared/schemas/storage';
import { finishUpload } from '../services/upload.service';

export const uploadFinishController = catchAsync(
  async (req: Request, res: Response) => {
    const { uploadId } = requestSchemas.uploadFinishSchema.parse(req.body);
    await finishUpload(req.id, req.user.id, uploadId);
    return res.status(204).end();
  },
);
