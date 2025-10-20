import { CopyJobPayload } from '@shared/jobs/payload.types';
import { prisma } from '@shared/prisma';
import { randomUUID } from 'crypto';
import {
  copyFileOnDisk,
  getFileExtension,
  getFileNameWithoutExtension,
  getOriginalFilePath,
  getThumbnailPath,
  resolveFileName,
} from '@shared/utils/storage.utils';
import { existsSync } from 'fs';

export const copyItems = async ({
  prismaJobId,
  items,
  destFolderId,
}: CopyJobPayload) => {
  let processed = 0;

  await Promise.all(
    items.map(async (item) => {
      if (item.type == 'folder') {
        await copyFolder(item.id, destFolderId);
      } else {
        await copyFile(item.id, destFolderId);
      }

      await prisma.job.update({
        where: { id: prismaJobId },
        data: { progress: (++processed / items.length) * 100 },
      });
    })
  );

  return { copiedAt: new Date().toISOString() };
};

export async function copyFile(
  fileId: string,
  targetFolderId: string | null = null
) {
  const srcFile = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!srcFile) {
    throw new Error('File does not exist');
  }

  try {
    const newFileId = randomUUID();
    const ext = getFileExtension(srcFile.name);

    const srcPath = getOriginalFilePath(srcFile.userId, fileId, ext);
    const destPath = getOriginalFilePath(srcFile.userId, newFileId, ext);
    await copyFileOnDisk(srcPath, destPath);

    const srcThumbnailPath = getThumbnailPath(srcFile.userId, fileId);
    if (existsSync(srcThumbnailPath)) {
      const destPath = getThumbnailPath(srcFile.userId, newFileId);
      await copyFileOnDisk(srcThumbnailPath, destPath);
    }

    const { newFileName, newFilePath } = await resolveFileName(
      srcFile,
      getFileNameWithoutExtension(srcFile.name),
      targetFolderId,
      true
    );

    return await prisma.file.create({
      data: {
        id: newFileId,
        name: newFileName,
        mimeType: srcFile.mimeType,
        size: srcFile.size,
        folderId: targetFolderId,
        fullPath: newFilePath,
        visibility: srcFile.visibility,
        userId: srcFile.userId,
      },
    });
  } catch (err) {
    throw new Error('Failed to copy file');
  }
}

async function copyFolder(srcFolderId: string, destFolderId: string) {
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

      await copyFolder(child.id, dest.id);
    })
  );
}
