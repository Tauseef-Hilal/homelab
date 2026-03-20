import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { getStorageProvider } from '@homelab/infra';
import { requestSchemas } from '@homelab/contracts/schemas/storage';

export const thumbnailController = catchAsync(
  async (req: Request, res: Response) => {
    const { fileId, userId } = requestSchemas.getThumbnailParamSchema.parse(
      req.params,
    );

    res.setHeader('Cache-Control', 'public, max-age=86400');

    const storage = getStorageProvider();
    storage.artifacts
      .openRead(storage.keys.thumbnail(userId, fileId))
      .pipe(res);
  },
);
