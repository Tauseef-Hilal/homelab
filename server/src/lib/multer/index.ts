import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import allowedMimeTypes from './mimetypes';
import { HttpError } from '@/errors/HttpError';
import { CommonErrorCode } from '@/errors/CommonErrorCode';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (allowedMimeTypes.has(file.mimetype)) cb(null, true);
  else
    cb(
      new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'Unsupported file type',
      })
    );
};

const limits = {
  fileSize: 100 * 1024 * 1024, // 100 MB
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});
