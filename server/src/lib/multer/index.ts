import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import allowedMimeTypes from './mimetypes';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (allowedMimeTypes.has(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported file type'));
};

const limits = {
  fileSize: 100 * 1024 * 1024, // 100 MB
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});
