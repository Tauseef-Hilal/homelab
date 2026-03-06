import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { createWriteStream, existsSync } from 'fs';
import { prisma } from '@shared/prisma';
import { HttpError } from '@shared/errors/HttpError';
import { Visibility } from '@prisma/client';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { CommonErrorCode } from '@shared/errors/CommonErrorCode';
import {
  resolveFileName,
  getFileExtension,
  getFileNameWithoutExtension,
} from '../utils/file.util';
import {
  getOriginalFilePath,
  getThumbnailPath,
} from '@shared/utils/storage.utils';
import { reserve, release } from '@shared/utils/quota.utils';

export async function saveFile(
  userId: string,
  file: Express.Multer.File,
  visibility: Visibility,
  folderId: string,
) {
  try {
    await reserve(userId, file.size);
    const fileMeta = await saveToDisk(file, userId, folderId, visibility);
    return await prisma.file.create({ data: fileMeta });
  } catch (err) {
    await release(userId, file.size);

    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to upload file',
        });
  }
}

async function saveToDisk(
  file: Express.Multer.File,
  userId: string,
  folderId: string,
  visibility: Visibility,
) {
  const fileId = randomUUID();
  const ext = getFileExtension(file.originalname);
  const storagePath = getOriginalFilePath(userId, fileId, ext);

  await fs.mkdir(path.dirname(storagePath), { recursive: true });
  await pipeline(Readable.from(file.buffer), createWriteStream(storagePath));

  const { newFileName, newFilePath } = await resolveFileName(
    { id: fileId, name: file.originalname, userId: userId },
    getFileNameWithoutExtension(file.originalname),
    folderId,
  );

  return {
    id: fileId,
    name: newFileName,
    mimeType: file.mimetype,
    size: file.size,
    folderId: folderId,
    fullPath: newFilePath,
    visibility,
    userId,
  };
}

export async function deleteFile(userId: string, fileId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { name: true, userId: true },
  });

  if (!file) {
    throw new HttpError({
      status: 400,
      code: CommonErrorCode.BAD_REQUEST,
      message: 'File does not exist. Ensure fileId is correct.',
    });
  }

  if (userId != file.userId) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: 'You do not have the permission to delete this file',
    });
  }

  try {
    const ext = getFileExtension(file.name);
    const filePath = getOriginalFilePath(userId, fileId, ext);
    await fs.rm(filePath);

    const thumbnailPath = getThumbnailPath(userId, fileId);
    if (existsSync(thumbnailPath)) {
      await fs.rm(thumbnailPath);
    }

    return await prisma.file.delete({
      where: { id: fileId },
    });
  } catch (err) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to delete file',
    });
  }
}

export async function getFileMeta(userId: string, fileId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      name: true,
      userId: true,
      mimeType: true,
      visibility: true,
      size: true,
    },
  });

  if (!file) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'File does not exist.',
    });
  }

  if (file.userId != userId && file.visibility == Visibility.public) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: 'You do not have the permission to download this file',
    });
  }

  const filePath = getOriginalFilePath(
    file.userId,
    file.id,
    getFileExtension(file.name),
  );

  if (!existsSync(filePath)) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'File missing on disk',
    });
  }

  return {
    filePath,
    fileName: file.name,
    mimeType: file.mimeType,
    fileSize: file.size,
  };
}

export async function ensureQuotaAvailable(userId: string, fileSize: number) {}
