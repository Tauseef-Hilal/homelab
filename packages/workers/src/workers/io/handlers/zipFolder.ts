import fs from 'fs';
import { ZipJobPayload } from '@shared/jobs/payload.types';
import { prisma } from '@shared/prisma';
import { randomUUID } from 'crypto';
import {
  getFileExtension,
  getOriginalFilePath,
  getTempFilePath,
} from '@shared/utils/storage.utils';
import archiver, { Archiver } from 'archiver';
import { Folder, File } from '@prisma/client';

export const zipFolder = async ({ folderId }: ZipJobPayload) => {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { files: true, children: true },
  });

  if (!folder) {
    throw Error('Folder does not exist');
  }

  const zipName = `${folder.name}_${randomUUID()}.zip`;
  const zipPath = getTempFilePath(zipName);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  await new Promise<string>(async (resolve, reject) => {
    output.on('close', () => resolve(zipPath));
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    await _createZipForDownload(archive, [], [folder], '');
    await archive.finalize();
  });

  return { zipPath, zippedAt: new Date().toISOString() };
};

async function _createZipForDownload(
  archiver: Archiver,
  files: File[],
  folders: Folder[],
  parentPath: string
) {
  files.forEach((file) => {
    const filePath = getOriginalFilePath(
      file.userId,
      file.id,
      getFileExtension(file.name)
    );

    archiver.file(filePath, { name: `${parentPath}/${file.name}` });
  });

  const foldersWithChildren = await prisma.folder.findMany({
    where: { id: { in: folders.map((f) => f.id) } },
    include: { files: true, children: true },
  });

  // Array.forEach does not wait for async funcs!
  for (const folder of foldersWithChildren) {
    const dirPath = `${parentPath}/${folder.name}`;
    archiver.file(folder.name, { name: dirPath });

    await _createZipForDownload(
      archiver,
      folder.files,
      folder.children,
      dirPath
    );
  }
}
