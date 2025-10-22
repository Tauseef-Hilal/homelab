import { DeleteJobPayload } from '@shared/jobs/payload.types';
import { DeleteJobResult } from '@shared/jobs/result.types';
import { prisma } from '@shared/prisma';
import {
  ensureFolderExists,
  ensureUserIsOwner,
  getFileExtension,
  getOriginalFilePath,
  getThumbnailPath,
} from '@shared/utils/storage.utils';
import { existsSync } from 'fs';
import fs from 'fs/promises';

export const deleteItems = async ({
  prismaJobId,
  userId,
  items,
}: DeleteJobPayload): Promise<DeleteJobResult> => {
  try {
    let processed = 0;

    for (const item of items) {
      if (item.type === 'folder') {
        await deleteFolder(userId, item.id);
      } else {
        await deleteFile(userId, item.id);
      }

      processed++;
      await prisma.job.update({
        where: { id: prismaJobId },
        data: { progress: (processed / items.length) * 100 },
      });
    }

    return { deletedAt: new Date().toISOString() };
  } catch (err) {
    throw new Error('Failed to delete items');
  }
};

export async function deleteFolder(userId: string, folderId: string) {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });

    ensureFolderExists(folder);
    ensureUserIsOwner(folder!, userId);

    // Get all descendant folder IDs
    const folderIds = await prisma.folder.findMany({
      where: { userId, fullPath: { startsWith: folder!.fullPath } },
      select: { id: true },
    });

    const folderIdList = folderIds.map((f) => f.id);

    // Get all descendant files
    const files = await prisma.file.findMany({
      where: { userId, folderId: { in: folderIdList } },
    });

    // Delte files on disk along with thumbnails
    await Promise.all(
      files.flatMap((file) => [
        fs.unlink(
          getOriginalFilePath(userId, file.id, getFileExtension(file.name))
        ),
        ...(file.hasThumbnail
          ? [fs.unlink(getThumbnailPath(userId, file.id))]
          : []),
      ])
    );

    // Delete from DB
    await prisma.$transaction([
      prisma.file.deleteMany({ where: { id: { in: files.map((f) => f.id) } } }),
      prisma.folder.deleteMany({ where: { id: { in: folderIdList } } }),
    ]);
  } catch (err) {
    throw new Error('Failed to delete folder');
  }
}

export async function deleteFile(userId: string, fileId: string) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { name: true, userId: true },
    });

    if (!file) {
      throw new Error('File does not exist. Ensure fileId is correct.');
    }

    if (userId != file.userId) {
      throw new Error('You do not have the permission to delete this file');
    }

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
    throw new Error('Failed to delete file');
  }
}
