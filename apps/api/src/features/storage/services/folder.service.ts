import { prisma } from '@homelab/db/prisma';
import { Folder } from '@prisma/client';
import {
  ensureFolderExists,
  ensureUserIsOwner,
  resolveFolderName,
} from '../utils/folder.util';
import { pathJoin } from '../utils/file.util';
import { HttpError } from '@homelab/contracts/errors';
import { CommonErrorCode } from '@homelab/contracts/errors';
import { randomUUID } from 'crypto';
import { getStorageProvider } from '@homelab/infra';

export async function createFolder(
  userId: string,
  folderName: string,
  parentId: string | null,
) {
  let parent: Folder | null = null;

  if (parentId) {
    parent = await prisma.folder.findUnique({ where: { id: parentId } });
    ensureFolderExists(parent);
    ensureUserIsOwner(parent!, userId);
  }

  const folderId = randomUUID();
  const resolvedName = await resolveFolderName(
    {
      id: folderId,
      name: folderName,
      userId,
    },
    folderName,
    parentId,
  );

  return await prisma.folder.create({
    data: {
      name: resolvedName,
      userId,
      fullPath: pathJoin(parent?.fullPath, resolvedName),
      parentId: parent?.id || null,
    },
  });
}

export async function prepareDownload(userId: string, folderId: string) {
  const folderOrNull = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { files: true, children: true },
  });

  ensureFolderExists(folderOrNull);
  const folder = folderOrNull!;
  ensureUserIsOwner(folder, userId);

  return { folderId, folderPath: folder.fullPath };
}

export async function validateLinkAndGetDownloadMeta(linkId: string) {
  const link = await prisma.downloadLink.findUnique({ where: { id: linkId } });
  const storage = getStorageProvider();

  if (!link || (link && !(await storage.artifacts.exists(link.artifactKey)))) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'The resource does not exist',
    });
  }

  // if (link.userId != userId) {
  //   throw new HttpError({
  //     status: 403,
  //     code: CommonErrorCode.FORBIDDEN,
  //     message: 'You do not have the permission to download this resource',
  //   });
  // }

  if (Date.now() > link.expiresAt.getTime()) {
    throw new HttpError({
      status: 410,
      code: CommonErrorCode.GONE,
      message: 'Download link has expired',
    });
  }

  return {
    fileStream: storage.artifacts.openRead(link.artifactKey),
    fileName: link.displayName,
  };
}

export async function listDirectory(userId: string, path: string) {
  const folderOrNull = await prisma.folder.findUnique({
    where: { userId_fullPath: { userId, fullPath: path } },
    include: { files: true, children: true },
  });

  ensureFolderExists(folderOrNull);
  const folder = folderOrNull!;

  return folder;
}
