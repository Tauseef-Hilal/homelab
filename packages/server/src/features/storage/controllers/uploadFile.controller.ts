import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { HttpError } from '@shared/errors/HttpError';
import { CommonErrorCode } from '@shared/errors/CommonErrorCode';
import { uploadFileSchema } from '@shared/schemas/storage/request.schema';
import { saveFile } from '../services/file.service';
import { getFileExtension } from '../utils/file.util';
import { getOriginalFilePath } from '@shared/utils/storage.utils';
import { success } from '@server/lib/response';
import { enqueueThumbnailJob } from '@server/lib/jobs/thumbnailQueue';
import { jobNames } from '@shared/jobs/constants';

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

    const result = await saveFile(req.user.id, req.file, visibility, folderId);

    const job = await enqueueThumbnailJob(jobNames.thumbnailJobName, {
      prismaJobId: '',
      requestId: req.id,
      userId: req.user.id,
      fileId: result.id,
      mimeType: result.mimeType,
      filePath: getOriginalFilePath(
        req.user.id,
        result.id,
        getFileExtension(result.name),
      ),
    });

    return res.status(201).json(
      success(
        {
          file: result,
          job,
        },
        'File uploaded succesfully',
      ),
    );
  },
);
