import { Folder } from '@prisma/client';
import { CommonErrorCode } from '@server/errors/CommonErrorCode';
import { HttpError } from '@server/errors/HttpError';
import { prisma } from '@shared/prisma';

export function ensureFolderExists(
  folder: Folder | null,
  errMsg: string = 'Folder does not exist'
) {
  if (!folder) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: errMsg,
    });
  }
}

export function ensureUserIsOwner(
  folder: Folder,
  userId: string,
  errMsg: string = 'You do not have the permission to perform this action'
) {
  if (folder.userId != userId) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: errMsg,
    });
  }
}

export async function resolveFolderName(
  folder: {
    id: string;
    name: string;
    userId: string;
  },
  newName: string,
  targetFolderId: string | null,
  copy: boolean = false
) {
  const existingFolders = await prisma.folder.findMany({
    where: { parentId: targetFolderId, userId: folder.userId },
    select: { id: true, name: true },
  });

  const existingFolderNames = existingFolders.map((f) =>
    f.id != folder.id || copy ? f.name : ''
  );

  let n = 1;
  let newFolderName = newName;

  while (existingFolderNames.includes(newFolderName)) {
    newFolderName = newName;
    newFolderName = `${newFolderName}-${n}`;
    n++;
  }

  return newFolderName;
}
