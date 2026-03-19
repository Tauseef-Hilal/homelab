import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { catchAsync } from '@server/lib/catchAsync';
import { saveChunk } from '../services/upload.service';

export const uploadChunkController = catchAsync(
  async (req: Request, res: Response) => {
    const headers = requestSchemas.uploadChunkHeaderSchema.parse(req.headers);

    const chunkBuffer: Buffer = req.body;
    await saveChunk(req.user.id, chunkBuffer, headers);

    res.status(204).end();
  },
);
