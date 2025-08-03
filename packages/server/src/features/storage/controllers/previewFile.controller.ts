import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { fileIdParamSchema } from '../schemas/storage.schema';
import { getFileMeta } from '../services/storage.service';
import { createReadStream } from 'fs';

export const previewFileController = catchAsync(
  async (req: Request, res: Response) => {
    const fileId = fileIdParamSchema.parse(req.params.fileId);
    const range = req.headers.range;

    const { filePath, fileSize, mimeType } = await getFileMeta(
      req.user.id,
      fileId
    );

    if (!range) {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Lenght', fileSize);
      return createReadStream(filePath).pipe(res);
    }

    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
      return;
    }

    const chunkSize = end - start + 1;
    const fileStream = createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
    });

    fileStream.pipe(res);
  }
);
