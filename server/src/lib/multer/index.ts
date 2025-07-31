import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import allowedMimeTypes from './mimetypes';
import { HttpError } from '@/errors/HttpError';
import { CommonErrorCode } from '@/errors/CommonErrorCode';
import { MAX_FILE_SIZE } from '@/features/storage/constants/limits';

const storage = multer.memoryStorage();

const fileFilter = (
  _: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (allowedMimeTypes.has(file.mimetype)) cb(null, true);
  else
    cb(
      new HttpError({
        status: 415,
        code: CommonErrorCode.UNSUPPORTED_MEDIA_TYPE,
        message: 'Unsupported file type',
      })
    );
};

const limits = {
  fileSize: MAX_FILE_SIZE,
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});
