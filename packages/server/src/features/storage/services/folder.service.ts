import fs from 'fs';
import { prisma } from '@shared/prisma';
import { Folder } from '@prisma/client';
import {
  ensureFolderExists,
  ensureUserIsOwner,
  resolveFolderName,
} from '../utils/folder.util';
import { getFileExtension, pathJoin } from '../utils/file.util';
import {
  getOriginalFilePath,
  getTempFilePath,
  getThumbnailPath,
} from '@shared/utils/storage.utils';
import { HttpError } from '@server/errors/HttpError';
import { CommonErrorCode } from '@server/errors/CommonErrorCode';
import { randomUUID } from 'crypto';

export async function createFolder(
  userId: string,
  folderName: string,
  parentId: string | null
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
    parentId
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

  if (!link || (link && !fs.existsSync(getTempFilePath(link.fileName)))) {
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

  return { filePath: getTempFilePath(link.fileName), fileName: link.fileName };
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
