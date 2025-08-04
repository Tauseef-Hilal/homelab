import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { env } from '@shared/config/env';
import { CommonErrorCode } from '@server/errors/CommonErrorCode';
import { HttpError } from '@server/errors/HttpError';
import { prisma } from '@shared/prisma';
import { createWriteStream } from 'fs';
import { File } from '@prisma/client';

export function getFileExtension(filename: string): string {
  const ext = path.extname(filename || '').toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

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
  folderId: string | null,
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
    newFilePath = newFileName;
  } else {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { fullPath: true },
    });

    if (!folder) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'Folder does not exist. Ensure folderId is correct',
      });
    }

    newFilePath = `${folder.fullPath}/${newFileName}`;
  }

  return { newFileName, newFilePath };
}
