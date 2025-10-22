import fs from 'fs/promises';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { env } from '@shared/config/env';
import { mediaConstants } from '@shared/constants/media.constants';
import path from 'path';
import { prisma } from '@shared/prisma';
import { Folder } from '@prisma/client';

export function getFileNameWithoutExtension(name: string) {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? name : name.slice(0, idx);
}

export function splitNameAndExtension(name: string) {
  const idx = name.lastIndexOf('.');
  return idx === -1
    ? { base: name, ext: '' }
    : { base: name.slice(0, idx), ext: name.slice(idx) };
}

export async function resolveFileName(
  file: {
    id: string;
    name: string;
    userId: string;
  },
  newNameWithoutExtension: string,
  folderId: string,
  copy: boolean = false
) {
  const existingFiles = await prisma.file.findMany({
    where: { folderId: folderId, userId: file.userId },
    select: { id: true, name: true },
  });

  const existingFileNames = existingFiles.map((f) =>
    f.id != file.id || copy ? f.name : ''
  );

  const ext = getFileExtension(file.name);
  let newFileName = newNameWithoutExtension;
  let newFilePath = '';

  let n = 1;
  while (existingFileNames.includes(`${newFileName}.${ext}`)) {
    newFileName = newNameWithoutExtension;
    newFileName = `${newFileName}-${n}`;
    n++;
  }

  newFileName = `${newFileName}.${ext}`;

  if (!folderId) {
    newFilePath = `/${newFileName}`;
  } else {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { fullPath: true },
    });

    if (!folder) {
      throw new Error('Folder does not exist');
    }

    newFilePath = `${folder.fullPath}/${newFileName}`;
  }

  return { newFileName, newFilePath };
}

export function pathJoin(parent: string | undefined, child: string) {
  return path.join(parent ?? '/', child);
}

export function getFileExtension(filename: string): string {
  const ext = path.extname(filename || '').toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

export async function copyFileOnDisk(src: string, dest: string) {
  await pipeline(
    Readable.from((await fs.open(src)).createReadStream()),
    createWriteStream(dest)
  );
}

export function getThumbnailPath(userId: string, fileId: string) {
  return path.join(getThumbnailsDirPath(userId), `${fileId}.webp`);
}

export function getThumbnailsDirPath(userId: string) {
  return path.join(
    env.MEDIA_DIR_PATH,
    userId,
    mediaConstants.thumbnailsDirName
  );
}

export function getOriginalFilePath(
  userId: string,
  fileId: string,
  ext: string
) {
  return path.join(getOriginalsDirPath(userId), `${fileId}.${ext}`);
}

export function getOriginalsDirPath(userId: string) {
  return path.join(env.MEDIA_DIR_PATH, userId, mediaConstants.originalsDirName);
}

export function getTempFilePath(fileName: string) {
  return path.join(env.TEMP_DIR_PATH, fileName);
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

export function ensureFolderExists(
  folder: Folder | null,
  errMsg: string = 'Folder does not exist'
) {
  if (!folder) {
    throw new Error(errMsg);
  }
}

export function ensureUserIsOwner(
  folder: Folder,
  userId: string,
  errMsg: string = 'You do not have the permission to perform this action'
) {
  if (folder.userId != userId) {
    throw new Error(errMsg);
  }
}
