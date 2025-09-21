import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { HttpError } from '@server/errors/HttpError';
import { CommonErrorCode } from '@server/errors/CommonErrorCode';
import { enqueueThumbnailJob } from '@server/queues/thumbnail.producer';
import { uploadFileSchema } from '../../../../../../shared/src/schemas/storage/request/file.schema';
import { ensureQuotaAvailable, saveFile } from '../../services/file.service';
import { getFileExtension } from '../../utils/file.util';
import { getOriginalFilePath } from '@shared/utils/storage.utils';
import { success } from '@server/lib/response';

export const uploadFileController = catchAsync(
  async (req: Request, res: Response) => {
    const { folderId, visibility } = uploadFileSchema.parse(req.body);

    if (!req.file) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'A file is required to upload',
      });
    }

    await ensureQuotaAvailable(req.user.id, req.file.size);
    const result = await saveFile(req.user.id, req.file, visibility, folderId);

    const job = await enqueueThumbnailJob({
      prismaJobId: '',
      requestId: req.id,
      userId: req.user.id,
      fileId: result.id,
      mimeType: result.mimeType,
      filePath: getOriginalFilePath(
        req.user.id,
        result.id,
        getFileExtension(result.name)
      ),
    });

    return res.status(201).json(
      success(
        {
          file: {
            id: result.id,
            name: result.name,
            fullPath: result.fullPath,
            size: result.size,
          },
          job,
        },
        'File uploaded succesfully'
      )
    );
  }
);
