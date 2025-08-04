import fs from 'fs/promises';
import { prisma } from '@shared/prisma';
import { Folder, PrismaClient, Prisma } from '@prisma/client';
import {
  ensureFolderExists,
  ensureUserHasPermission,
  resolveFolderName,
} from '../utils/folder.util';
import {
  copyFileOnDisk,
  getFileExtension,
  getOriginalFilePath,
} from '../utils/file.util';
import { getThumbnailPath } from '@shared/utils/storage.utils';
import { HttpError } from '@server/errors/HttpError';
import { CommonErrorCode } from '@server/errors/CommonErrorCode';
import { randomUUID } from 'crypto';
import { DefaultArgs } from '@prisma/client/runtime/library';

export async function createFolder(
  userId: string,
  folderName: string,
  parentId: string | null
) {
  let parent: Folder | null = null;

  if (parentId) {
    parent = await prisma.folder.findUnique({ where: { id: parentId } });
    ensureFolderExists(parent);
    ensureUserHasPermission(parent!, userId);
  }

  const folderId = randomUUID();
  const resolvedName = await resolveFolderName(
    {
      id: folderId,
      name: folderName,
      userId,
    },
    folderName,
    parentId
  );

  return await prisma.folder.create({
    data: {
      name: resolvedName,
      userId,
      fullPath: parent ? `${parent.fullPath}/${resolvedName}` : resolvedName,
      parentId: parent?.id || null,
    },
  });
}

export async function deleteFolder(userId: string, folderId: string) {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });

  ensureFolderExists(folder);
  ensureUserHasPermission(folder!, userId);

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
}

export async function moveFolder(
  userId: string,
  folderId: string,
  targetFolderId: string | null = null,
  newName: string | null = null
) {
  const renameOnly = folderId == targetFolderId;
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, name: true, userId: true, fullPath: true },
  });

  ensureFolderExists(folder as Folder);
  ensureUserHasPermission(folder as Folder, userId);

  const targetFolder = await prisma.folder.findUnique({
    where: { id: targetFolderId ?? '' },
  });

  if (targetFolderId && !targetFolder) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'Target folder does not exist',
    });
  }

  // Handle name collisions
  const resolvedName = await resolveFolderName(
    folder!,
    newName ?? folder!.name,
    targetFolderId
  );

  const oldPathPrefix = folder!.fullPath;
  const parentPath = oldPathPrefix.slice(0, oldPathPrefix.lastIndexOf('/'));
  let newPathPrefix = `${parentPath}/${resolvedName}`;

  if (!renameOnly) {
    newPathPrefix = targetFolder
      ? `${targetFolder.fullPath}/${resolvedName}`
      : resolvedName;
  }

  await prisma.$transaction([
    prisma.folder.update({
      where: { id: folderId },
      data: {
        name: resolvedName,
        fullPath: newPathPrefix,
      },
    }),
    prisma.$executeRawUnsafe(
      `
      UPDATE "Folder"
      SET "fullPath" = REPLACE("fullPath", $1, $2)
      WHERE "fullPath" LIKE $3 AND "userId" = $4
    `,
      oldPathPrefix,
      newPathPrefix,
      `${oldPathPrefix}%`,
      userId
    ),
    prisma.$executeRawUnsafe(
      `
      UPDATE "File"
      SET "fullPath" = REPLACE("fullPath", $1, $2)
      WHERE "fullPath" LIKE $3 AND "userId" = $4
    `,
      oldPathPrefix,
      newPathPrefix,
      `${oldPathPrefix}%`,
      userId
    ),
  ]);
}

export async function copyFolder(
  userId: string,
  folderId: string,
  targetFolderId: string | null
) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, name: true, userId: true, fullPath: true },
  });
  ensureFolderExists(folder as Folder);
  ensureUserHasPermission(folder as Folder, userId);

  const targetFolder = await prisma.folder.findUnique({
    where: { id: targetFolderId ?? '' },
  });

  if (targetFolderId) {
    ensureFolderExists(targetFolder);
    ensureUserHasPermission(targetFolder!, userId);

    if (targetFolder!.fullPath.startsWith(folder!.fullPath + '/')) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'Cannot copy a folder into its own subtree.',
      });
    }
  }

  const resolvedName = await resolveFolderName(
    folder!,
    folder!.name,
    targetFolderId,
    true
  );

  const newFolder = await prisma.folder.create({
    data: {
      name: resolvedName,
      userId,
      parentId: targetFolderId,
      fullPath: targetFolder
        ? `${targetFolder.fullPath}/${resolvedName}`
        : resolvedName,
    },
  });

  await prisma.$transaction(
    async (tx) => await _copyFolder(tx, folder!.id, newFolder.id)
  );
}

async function _copyFolder(
  prisma: Omit<
    PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  srcFolderId: string,
  destFolderId: string
) {
  const srcFolder = await prisma.folder.findUnique({
    where: { id: srcFolderId },
    include: { files: true, children: true },
  });

  const destFolder = await prisma.folder.findUnique({
    where: { id: destFolderId },
  });

  await Promise.all(
    srcFolder!.files.map(async (file) => {
      const newFileId = randomUUID();
      const ext = getFileExtension(file.name);

      let srcPath = getOriginalFilePath(srcFolder!.userId, file.id, ext);
      let destPath = getOriginalFilePath(srcFolder!.userId, newFileId, ext);
      await copyFileOnDisk(srcPath, destPath);

      if (file.hasThumbnail) {
        srcPath = getThumbnailPath(srcFolder!.userId, file.id);
        destPath = getThumbnailPath(srcFolder!.userId, newFileId);
        await copyFileOnDisk(srcPath, destPath);
      }

      await prisma.file.create({
        data: {
          id: newFileId,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          userId: file.userId,
          folderId: destFolder!.id,
          fullPath: `${destFolder!.fullPath}/${file.name}`,
        },
      });
    })
  );

  await Promise.all(
    srcFolder!.children.map(async (child) => {
      const dest = await prisma.folder.create({
        data: {
          name: child.name,
          userId: child.userId,
          parentId: destFolder!.id,
          fullPath: `${destFolder!.fullPath}/${child.name}`,
        },
        select: { id: true },
      });

      await _copyFolder(prisma, child.id, dest.id);
    })
  );
}
