import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/errors/HttpError';
import { StorageErrorCode } from '../constants/StorageErrorCode';
import { MAX_USER_STORAGE_QUOTA } from '../constants/limits';
import { Visibility } from '@prisma/client';
import { env } from '@/config/env';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { CommonErrorCode } from '@/errors/CommonErrorCode';
import { getExtension } from '../utils/extension.util';

export async function saveFile(
  userId: string,
  file: Express.Multer.File,
  visibility: Visibility,
  folderId?: string
) {
  const fileId = randomUUID();
  const ext = getExtension(file.originalname);
  const storagePath = path.join(env.STORAGE_ROOT, userId, `${fileId}.${ext}`);
  const fullPath = await constructFullPath(file.originalname, folderId);

  try {
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await pipeline(Readable.from(file.buffer), createWriteStream(storagePath));

    return await prisma.file.create({
      data: {
        id: fileId,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        folderId: folderId,
        visibility,
        fullPath,
        userId,
      },
    });
  } catch (err) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to upload file',
    });
  }
}

export async function ensureQuotaAvailable(userId: string, fileSize: number) {
  const used = await prisma.file.aggregate({
    _sum: { size: true },
    where: { userId },
  });

  const totalUsed = used._sum.size ?? 0;

  if (totalUsed + fileSize > MAX_USER_STORAGE_QUOTA) {
    throw new HttpError({
      status: 413,
      code: StorageErrorCode.QUOTA_EXCEEDED,
      message: 'Storage quota exceeded',
    });
  }
}

export async function constructFullPath(fileName: string, folderId?: string) {
  if (!folderId) {
    return fileName;
  }

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { fullPath: true },
  });

  if (!folder) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.BAD_REQUEST,
      message: 'Folder does not exist. Ensure folderId is correct.',
    });
  }

  return `${folder.fullPath}/${fileName}`;
}
