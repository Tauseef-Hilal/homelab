import { prisma } from '@/lib/prisma';
import path from 'path';

export function getFileExtension(filename: string): string {
  const ext = path.extname(filename || '').toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

export function getFileNameWithoutExtension(name: string) {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? name : name.slice(0, idx);
}

export async function resolveFileName(
  file: {
    id: string;
    name: string;
    userId: string;
    folderId: string | null;
  },
  newName: string
) {
  const existingFiles = await prisma.file.findMany({
    where: { folderId: file.folderId, userId: file.userId },
    select: { id: true, name: true },
  });

  const existingFileNames = existingFiles.map((f) =>
    f.id != file.id ? f.name : ''
  );

  const ext = getFileExtension(file.name);
  let newFileName = newName;
  let newFilePath = '';

  let n = 1;
  while (existingFileNames.includes(`${newFileName}.${ext}`)) {
    newFileName = newName;
    newFileName = `${newFileName}-${n}`;
    n++;
  }

  newFileName = `${newFileName}.${ext}`;

  if (!file.folderId) {
    newFilePath = newFileName;
  } else {
    const folder = await prisma.folder.findUnique({
      where: { id: file.folderId },
      select: { fullPath: true },
    });
    newFilePath = `${folder!.fullPath}/${newFileName}`;
  }

  return { newFileName, newFilePath };
}
