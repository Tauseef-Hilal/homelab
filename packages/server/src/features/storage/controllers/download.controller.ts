import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { requestSchemas } from '@homelab/shared/schemas/storage';
import { validateLinkAndGetDownloadMeta } from '../services/folder.service';

export const downloadController = catchAsync(
  async (req: Request, res: Response) => {
    const id = requestSchemas.idParamSchema.parse(req.params.id);

    const { filePath, fileName } = await validateLinkAndGetDownloadMeta(id);

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/zip');

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  },
);
