import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { catchAsync } from '@server/lib/catchAsync';
import { resolveExistingChunks } from '../services/upload.service';
import { success } from '@server/lib/response';

export const uploadChunkCheckController = catchAsync(
  async (req: Request, res: Response) => {
    const input = requestSchemas.uploadChunkCheckSchema.parse(req.body);
    const result = await resolveExistingChunks(req.user.id, input);
    res.status(200).json(success(result));
  },
);
