import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { fileIdParamSchema } from '../schemas/storage.schema';
import { getFileMeta } from '../services/storage.service';
import { createReadStream } from 'fs';

export const downloadFileController = catchAsync(
  async (req: Request, res: Response) => {
    const fileId = fileIdParamSchema.parse(req.params.fileId);
    const { fileName, filePath, mimeType } = await getFileMeta(
      req.user.id,
      fileId
    );

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', mimeType);

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }
);
