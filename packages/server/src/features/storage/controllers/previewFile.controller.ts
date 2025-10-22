import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import {
  idParamSchema,
  previewFileQuerySchema,
} from '@shared/schemas/storage/request.schema';
import { getFileMeta } from '../services/file.service';
import { verifyAccessToken } from '@server/lib/jwt';
import { throwUnauthorized } from '@server/features/auth/utils/error.util';

export const previewFileController = catchAsync(
  async (req: Request, res: Response) => {
    const { token } = previewFileQuerySchema.parse(req.query);
    try {
      const { sub } = verifyAccessToken(token);

      const fileId = idParamSchema.parse(req.params.fileId);
      const range = req.headers.range;

      const { filePath, fileSize, mimeType } = await getFileMeta(sub, fileId);

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
    } catch (err) {
      throwUnauthorized();
    }
  }
);
