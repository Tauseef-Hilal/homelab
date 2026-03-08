import { env } from '@shared/config/env';
import { HttpError } from '@shared/errors/HttpError';
import { CommonErrorCode } from '@shared/errors/CommonErrorCode';
import { DeleteJobPayload } from '@shared/jobs/payload.types';
import { DeleteJobResult } from '@shared/jobs/result.types';
import { prisma } from '@shared/prisma';
import { calculateSize, release } from '@shared/utils/quota.utils';
import {
  ensureFolderExists,
  ensureUserIsOwner,
  getFileExtension,
  getOriginalFilePath,
  getThumbnailPath,
} from '@shared/utils/storage.utils';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import redis from '@shared/redis';
import { RedisKeys } from '@shared/redis/redisKeys';

export const deleteItems = async ({
  prismaJobId,
  userId,
  items,
}: DeleteJobPayload): Promise<DeleteJobResult> => {
  // Track successfully moved files to allow rollback on failure
  let processed: { srcPath: string; destPath: string }[] = [];

  try {
    // Separate incoming items into file IDs and folder IDs
    const fileIds: string[] = [];
    const folderIds: string[] = [];

    items.forEach((item) =>
      item.type == 'file' ? fileIds.push(item.id) : folderIds.push(item.id),
    );

    // Calculate total storage that will be freed
    const freedSize = await calculateSize(fileIds, folderIds);

    // Collect all physical file paths that must be deleted
    const filePaths: string[] = [];

    for (const item of items) {
      if (item.type === 'folder') {
        const res = await getDescendantFilePaths(userId, item.id);
        filePaths.push(...res);
      } else {
        const res = await getFileAndThumbnailPath(userId, item.id);
        filePaths.push(...res);
      }
    }

    // Ensure trash directory exists before moving files
    await fs.mkdir(path.resolve(env.TRASH_DIR_PATH), { recursive: true });

    // Periodically update job progress in Redis
    const progressInterval = setInterval(async () => {
      const progress = Math.floor((processed.length / filePaths.length) * 100);
      redis.setex(RedisKeys.jobs.progress(prismaJobId), 60, progress);
    }, 1000);

    // Move each file to trash directory
    for (const srcPath of filePaths) {
      if (!existsSync(srcPath)) continue;

      const destPath = path.join(
        path.resolve(env.TRASH_DIR_PATH),
        `${Date.now()}-${path.basename(srcPath)}`,
      );

      await fs.rename(srcPath, destPath);
      processed.push({ srcPath, destPath });
    }

    // Stop progress updates after processing completes
    clearInterval(progressInterval);

    // Delete file and folder records from database in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.file.deleteMany({ where: { id: { in: fileIds } } });
      await tx.folder.deleteMany({ where: { id: { in: folderIds } } });
    });

    // Release the freed storage quota for the user
    await release(userId, freedSize);

    return { deletedAt: new Date().toISOString() };
  } catch (err) {
    // Roll back filesystem changes by restoring moved files
    for (const item of processed) {
      fs.rename(item.destPath, item.srcPath);
    }

    console.error(err);

    // Normalize unknown errors into HttpError
    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete items',
        });
  }
};

// Retrieve all file and thumbnail paths belonging to a folder and its descendants
export async function getDescendantFilePaths(userId: string, folderId: string) {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });

  // Validate folder existence and ownership
  ensureFolderExists(folder);
  ensureUserIsOwner(folder!, userId);

  // Fetch all files whose path is inside the folder hierarchy
  const files = await prisma.file.findMany({
    where: { userId, fullPath: { startsWith: folder?.fullPath + '/' } },
  });

  // Build disk paths for originals and thumbnails
  const paths: string[] = [];

  files.forEach((file) => {
    paths.push(
      getOriginalFilePath(userId, file.id, getFileExtension(file.name)),
    );
    if (file.hasThumbnail) {
      paths.push(getThumbnailPath(userId, file.id));
    }
  });

  return paths;
}

// Retrieve disk paths for a single file and its thumbnail
export async function getFileAndThumbnailPath(userId: string, fileId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { name: true, userId: true },
  });

  // Validate file existence
  if (!file) {
    throw new Error('File does not exist. Ensure fileId is correct.');
  }

  // Ensure user has permission to delete the file
  if (userId != file.userId) {
    throw new Error('You do not have the permission to delete this file');
  }

  const res = [];

  // Build original file path
  const ext = getFileExtension(file.name);
  const filePath = getOriginalFilePath(userId, fileId, ext);
  res.push(filePath);

  // Include thumbnail path if it exists
  const thumbnailPath = getThumbnailPath(userId, fileId);
  if (existsSync(thumbnailPath)) {
    res.push(thumbnailPath);
  }

  return res;
}
