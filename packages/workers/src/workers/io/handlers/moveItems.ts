import { Folder } from '@prisma/client';
import { MoveJobPayload } from '@shared/jobs/payload.types';
import { MoveJobResult } from '@shared/jobs/result.types';
import { prisma } from '@shared/prisma';
import redis from '@shared/redis';
import { RedisKeys } from '@shared/redis/redisKeys';
import {
  ensureFolderExists,
  ensureUserIsOwner,
  getFileNameWithoutExtension,
  pathJoin,
  resolveFileName,
  resolveFolderName,
} from '@shared/utils/storage.utils';
import { validateFolderCopyPaths } from '@workers/utils/storage';

export const moveItems = async ({
  prismaJobId,
  userId,
  items,
  destFolderId,
}: MoveJobPayload): Promise<MoveJobResult> => {
  try {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type === 'folder') {
        await moveFolder(userId, item.id, destFolderId!, item.newName);
      } else {
        await moveFile(userId, item.id, destFolderId, item.newName);
      }

      redis.setex(
        RedisKeys.jobs.progress(prismaJobId),
        60,
        Math.floor(((i + 1) / items.length) * 100),
      );
    }

    return { movedAt: new Date().toISOString() };
  } catch (err) {
    throw new Error('Failed to move items');
  }
};

export async function moveFolder(
  userId: string,
  folderId: string,
  destFolderId: string,
  newName?: string,
) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: {
      id: true,
      name: true,
      userId: true,
      fullPath: true,
      parentId: true,
    },
  });

  ensureFolderExists(folder as Folder);
  ensureUserIsOwner(folder as Folder, userId);

  const destFolder = await prisma.folder.findUnique({
    where: { id: destFolderId },
  });

  ensureFolderExists(destFolder as Folder, 'Target folder does not exist');
  validateFolderCopyPaths(folder!.fullPath, destFolder!.fullPath);

  // Handle name collisions
  const resolvedName = await resolveFolderName(
    folder!,
    newName ?? folder!.name,
    destFolderId,
  );

  const oldPath = folder!.fullPath;
  const parentPath = oldPath.slice(0, oldPath.lastIndexOf('/'));
  let newPath = pathJoin(parentPath, resolvedName);

  if (destFolderId != folder!.parentId) {
    newPath = pathJoin(destFolder!.fullPath, resolvedName);
  }

  await prisma.$transaction([
    prisma.folder.update({
      where: { id: folderId },
      data: {
        name: resolvedName,
        fullPath: newPath,
        parentId: destFolderId,
      },
    }),
    prisma.$executeRawUnsafe(
      `
      UPDATE "Folder"
      SET "fullPath" = REPLACE("fullPath", $1, $2)
      WHERE "fullPath" LIKE $3 AND "userId" = $4
    `,
      oldPath,
      newPath,
      `${oldPath}%`,
      userId,
    ),
    prisma.$executeRawUnsafe(
      `
      UPDATE "File"
      SET "fullPath" = REPLACE("fullPath", $1, $2)
      WHERE "fullPath" LIKE $3 AND "userId" = $4
    `,
      oldPath,
      newPath,
      `${oldPath}%`,
      userId,
    ),
  ]);
}

export async function moveFile(
  userId: string,
  fileId: string,
  destFolderId?: string,
  newName?: string,
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
    throw new Error('File does not exist. Ensure fileId is correct.');
  }

  if (file.userId != userId) {
    throw new Error('You do not have the permission to move this file');
  }

  if (destFolderId === undefined) {
    destFolderId = file.folderId;
  }

  const { newFileName, newFilePath } = await resolveFileName(
    file,
    newName ?? getFileNameWithoutExtension(file.name),
    destFolderId,
  );

  try {
    return await prisma.file.update({
      where: { id: file.id },
      data: {
        name: newFileName,
        fullPath: newFilePath,
        folderId: destFolderId,
      },
    });
  } catch (err) {
    throw new Error('Failed to move file');
  }
}
