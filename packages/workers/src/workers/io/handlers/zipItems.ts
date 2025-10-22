import fs from 'fs';
import { ZipJobPayload } from '@shared/jobs/payload.types';
import { prisma } from '@shared/prisma';
import { randomUUID } from 'crypto';
import {
  ensureFolderExists,
  ensureUserIsOwner,
  getFileExtension,
  getOriginalFilePath,
  getTempFilePath,
} from '@shared/utils/storage.utils';
import archiver, { Archiver } from 'archiver';
import { ZipJobResult } from '@shared/jobs/result.types';
import path from 'path';
import { zipConstants } from '@workers/constants/zip.constants';
import { updateJob } from '@workers/utils/db';
import { env } from '@shared/config/env';

export const zipItems = async ({
  prismaJobId,
  userId,
  requestId,
  items,
}: ZipJobPayload): Promise<ZipJobResult> => {
  try {
    const zipName = `${randomUUID()}.zip`;
    const zipPath = getTempFilePath(zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise<string>(async (resolve, reject) => {
      output.on('close', () => resolve(zipPath));
      archive.on('error', (err) => reject(err));
      archive.pipe(output);

      let processed = 0;
      for (const item of items) {
        if (item.type === 'folder') {
          await zipFolder(archive, userId, item.id, null);
        } else {
          await zipFile(archive, userId, item.id, null);
        }

        await prisma.job.update({
          where: { id: prismaJobId },
          data: { progress: (++processed / items.length) * 100 },
        });
      }

      await archive.finalize();
    });

    const link = await prisma.downloadLink.create({
      data: {
        userId,
        requestId,
        fileName: path.basename(zipPath),
        expiresAt: new Date(Date.now() + zipConstants.DOWNLOAD_LINK_EXPIRY_MS),
      },
    });

    await updateJob(prismaJobId, {
      result: {
        downloadLink: `${env.API_BASE_URL}/storage/download/${link.id}`,
      },
    });

    return { zippedAt: new Date().toISOString(), zipPath };
  } catch (err) {
    throw new Error('Failed to zip items');
  }
};

async function zipFolder(
  archiver: Archiver,
  userId: string,
  folderId: string,
  parentPath: string | null
) {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true, children: true },
    });

    ensureFolderExists(folder);
    ensureUserIsOwner(folder!, userId);

    folder!.files.forEach((file) => {
      const filePath = getOriginalFilePath(
        file.userId,
        file.id,
        getFileExtension(file.name)
      );

      archiver.file(filePath, {
        name: `${parentPath ?? folder!.name}/${file.name}`,
      });
    });

    // Array.forEach does not wait for async funcs!
    for (const child of folder!.children) {
      const dirPath = `${parentPath ?? folder!.name}/${child!.name}`;
      archiver.file(folder!.name, { name: dirPath });

      await zipFolder(archiver, userId, child.id, dirPath);
    }
  } catch (err) {
    throw new Error('Failed to zip folder');
  }
}

async function zipFile(
  archiver: Archiver,
  userId: string,
  fileId: string,
  parentPath: string | null
) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File doesnt exist');
    }

    if (file.userId != userId) {
      throw new Error('You dont have the permission to download this file');
    }

    const filePath = getOriginalFilePath(
      file.userId,
      file.id,
      getFileExtension(file.name)
    );

    archiver.file(filePath, { name: `${parentPath ?? ''}/${file.name}` });
  } catch (err) {
    throw new Error('Failed to zip file');
  }
}
