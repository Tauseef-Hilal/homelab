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
import { resolveFileName, getFileExtension, getFileNameWithoutExtension } from '../utils/file.util';

export async function saveFile(
  userId: string,
  file: Express.Multer.File,
  visibility: Visibility,
  folderId: string | null = null
) {
  const fileId = randomUUID();
  const ext = getFileExtension(file.originalname);
  const storagePath = path.join(env.STORAGE_ROOT, userId, `${fileId}.${ext}`);

  try {
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await pipeline(Readable.from(file.buffer), createWriteStream(storagePath));
    
    const { newFileName, newFilePath } = await resolveFileName(
      { id: fileId, name: file.originalname, userId: userId, folderId },
      getFileNameWithoutExtension(file.originalname)
    );

    return await prisma.file.create({
      data: {
        id: fileId,
        name: newFileName,
        mimeType: file.mimetype,
        size: file.size,
        folderId: folderId,
        fullPath: newFilePath,
        visibility,
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
    const filePath = path.join(env.STORAGE_ROOT, userId, `${fileId}.${ext}`);
    await fs.rm(filePath);

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

export async function renameFile(
  userId: string,
  fileId: string,
  newName: string
) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      name: true,
      userId: true,
      folderId: true,
    },
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
      message: 'You do not have the permission to rename this file',
    });
  }

  try {
    const { newFileName, newFilePath } = await resolveFileName(file, newName);

    await prisma.file.update({
      where: { id: fileId },
      data: {
        name: newFileName,
        fullPath: newFilePath,
      },
    });
  } catch (err) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to rename file',
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
