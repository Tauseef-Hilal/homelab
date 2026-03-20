import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { validateLinkAndGetDownloadMeta } from '../services/folder.service';

export const downloadController = catchAsync(
  async (req: Request, res: Response) => {
    const id = requestSchemas.idParamSchema.parse(req.params.id);

    const { fileStream, fileName } = await validateLinkAndGetDownloadMeta(id);

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/zip');

    fileStream.pipe(res);
  },
);
