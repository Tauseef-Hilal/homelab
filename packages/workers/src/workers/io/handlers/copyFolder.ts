import { CopyJobPayload } from '@shared/jobs/payload.types';
import { prisma } from '@shared/prisma';
import { randomUUID } from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import {
  copyFileOnDisk,
  getFileExtension,
  getOriginalFilePath,
  getThumbnailPath,
} from '@shared/utils/storage.utils';

export const copyFolder = async ({
  srcFolderId,
  destFolderId,
  destPath,
}: CopyJobPayload) => {
  await prisma.$transaction(
    async (tx) => await _copyFolder(tx, srcFolderId, destFolderId)
  );

  return { destPath, copiedAt: new Date().toISOString() };
};

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
