import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { fileIdParamSchema } from '../../schemas/file.schema';
import { getFileMeta } from '../../services/file.service';

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
