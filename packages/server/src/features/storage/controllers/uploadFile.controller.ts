import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { uploadFileSchema } from '../schemas/storage.schema';
import { HttpError } from '@server/errors/HttpError';
import { CommonErrorCode } from '@server/errors/CommonErrorCode';
import * as StorageService from '../services/storage.service';

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

    await StorageService.ensureQuotaAvailable(req.user.id, req.file.size);
    const result = await StorageService.saveFile(
      req.user.id,
      req.file,
      visibility,
      folderId
    );

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: result.id,
        name: result.name,
        fullPath: result.fullPath,
        size: result.size,
      },
    });
  }
);
