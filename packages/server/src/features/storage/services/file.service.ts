import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { createWriteStream, existsSync } from 'fs';
import { prisma } from '@shared/prisma';
import { HttpError } from '@server/errors/HttpError';
import { StorageErrorCode } from '../constants/StorageErrorCode';
import { MAX_USER_STORAGE_QUOTA } from '../constants/limits';
import { Visibility } from '@prisma/client';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { CommonErrorCode } from '@server/errors/CommonErrorCode';
import {
  resolveFileName,
  getFileExtension,
  getFileNameWithoutExtension,
} from '../utils/file.util';
import { copyFileOnDisk, getOriginalFilePath, getThumbnailPath } from '@shared/utils/storage.utils';

export async function saveFile(
  userId: string,
  file: Express.Multer.File,
  visibility: Visibility,
  folderId: string | null = null
) {
  const fileId = randomUUID();
  const ext = getFileExtension(file.originalname);
  const storagePath = getOriginalFilePath(userId, fileId, ext);

  try {
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await pipeline(Readable.from(file.buffer), createWriteStream(storagePath));

    const { newFileName, newFilePath } = await resolveFileName(
      { id: fileId, name: file.originalname, userId: userId },
      getFileNameWithoutExtension(file.originalname),
      folderId
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
    console.log(err);
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
    const { newFileName, newFilePath } = await resolveFileName(
      file,
      newName,
      file.folderId
    );

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

export async function moveFile(
  userId: string,
  fileId: string,
  targetFolderId: string | null = null
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

  if (file.userId != userId) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: 'You do not have the permission to move this file',
    });
  }

  if (file.folderId == targetFolderId) return;

  const { newFileName, newFilePath } = await resolveFileName(
    file,
    getFileNameWithoutExtension(file.name),
    targetFolderId
  );

  try {
    return await prisma.file.update({
      where: { id: file.id },
      data: { name: newFileName, fullPath: newFilePath },
    });
  } catch (err) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to move file',
    });
  }
}

export async function copyFile(
  userId: string,
  fileId: string,
  targetFolderId: string | null = null
) {
  const srcFile = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!srcFile) {
    throw new HttpError({
      status: 400,
      code: CommonErrorCode.BAD_REQUEST,
      message: 'File does not exist. Ensure fileId is correct.',
    });
  }

  if (srcFile.userId != userId) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: 'You do not have the permission to copy this file',
    });
  }

  await ensureQuotaAvailable(userId, srcFile.size);

  try {
    const newFileId = randomUUID();
    const ext = getFileExtension(srcFile.name);

    const srcPath = getOriginalFilePath(userId, fileId, ext);
    const destPath = getOriginalFilePath(userId, newFileId, ext);
    await copyFileOnDisk(srcPath, destPath);

    const srcThumbnailPath = getThumbnailPath(userId, fileId);
    if (existsSync(srcThumbnailPath)) {
      const destPath = getThumbnailPath(userId, newFileId);
      await copyFileOnDisk(srcThumbnailPath, destPath);
    }

    const { newFileName, newFilePath } = await resolveFileName(
      srcFile,
      getFileNameWithoutExtension(srcFile.name),
      targetFolderId,
      true
    );

    return await prisma.file.create({
      data: {
        id: newFileId,
        name: newFileName,
        mimeType: srcFile.mimeType,
        size: srcFile.size,
        folderId: targetFolderId,
        fullPath: newFilePath,
        visibility: srcFile.visibility,
        userId,
      },
    });
  } catch (err) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to copy file',
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
    getFileExtension(file.name)
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
