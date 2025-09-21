import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { idParamSchema } from '../../../../../../shared/src/schemas/storage/request/folder.schema';
import { validateLinkAndGetDownloadMeta } from '../../services/folder.service';

export const downloadController = catchAsync(
  async (req: Request, res: Response) => {
    const id = idParamSchema.parse(req.params.id);

    const { filePath, fileName } = await validateLinkAndGetDownloadMeta(
      req.user.id,
      id
    );

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/zip');

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }
);
