import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import { verifyAccessToken } from '@server/lib/jwt';
import { throwUnauthorized } from '@server/features/auth/utils/error.util';
import { getFileStream } from '@homelab/storage';
import { getFileMeta } from '../services/file.service';

export const previewFileController = catchAsync(
  async (req: Request, res: Response) => {
    const { token } = requestSchemas.previewFileQuerySchema.parse(req.query);
    try {
      const { sub } = verifyAccessToken(token);

      const fileId = requestSchemas.idParamSchema.parse(req.params.fileId);
      const range = req.headers.range;

      const file = await getFileMeta(sub, fileId);

      if (!range) {
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Length', file.size);
        return getFileStream(file).pipe(res);
      }

      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : file.size - 1;

      if (start >= file.size || end >= file.size) {
        res
          .status(416)
          .setHeader('Content-Range', `bytes */${file.size}`)
          .end();
        return;
      }

      const chunkSize = end - start + 1;
      const fileStream = getFileStream(file, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${file.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': file.mimeType,
      });

      fileStream.pipe(res);
    } catch (err) {
      throwUnauthorized();
    }
  },
);
