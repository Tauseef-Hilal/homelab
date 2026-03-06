import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { SYSTEM_STORAGE_LIMIT } from '@shared/constants/storage.constants';
import { HttpError } from '@shared/errors/HttpError';
import { StorageErrorCode } from '@shared/errors/StorageErrorCode';
import { prisma } from '@shared/prisma';

export async function reserve(userId: string, size: number) {
  await prisma.$transaction(async (tx) => {
    const [systemStorage] = await tx.$queryRaw<{ totalStorageUsed: number }[]>`
      SELECT "totalStorageUsed"
      FROM "SystemStats"
      FOR UPDATE
    `;

    if (systemStorage.totalStorageUsed + size > SYSTEM_STORAGE_LIMIT) {
      throw new HttpError({
        status: 413,
        code: StorageErrorCode.SERVER_LIMIT_EXCEEDED,
        message: 'Server storage limit reached',
      });
    }

    const [userStorage] = await tx.$queryRaw<
      { storageQuota: number; storageUsed: number }[]
    >`
      SELECT "storageQuota", "storageUsed"
      FROM "User"
      WHERE id = ${userId}
      FOR UPDATE
    `;

    const { storageQuota, storageUsed } = userStorage!;

    if (storageUsed + size > storageQuota) {
      throw new HttpError({
        status: 413,
        code: StorageErrorCode.QUOTA_EXCEEDED,
        message: 'Storage quota exceeded',
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: size } },
    });

    await tx.systemStats.updateMany({
      data: { totalStorageUsed: { increment: size } },
    });
  });
}

export async function release(userId: string, size: number) {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { storageUsed: { decrement: size } },
    });

    await tx.systemStats.updateMany({
      data: { totalStorageUsed: { decrement: size } },
    });
  });
}

export async function calculateSize(fileIds: string[], folderIds: string[]) {
  const directFilesSize = await prisma.file.aggregate({
    where: { id: { in: fileIds } },
    _sum: { size: true },
  });

  const targetFolders = await prisma.folder.findMany({
    where: { id: { in: folderIds } },
    select: { fullPath: true },
  });

  const descendantFilesSize =
    targetFolders.length === 0
      ? { _sum: { size: 0 } }
      : await prisma.file.aggregate({
          where: {
            OR: targetFolders.map((folder) => ({
              fullPath: {
                startsWith: folder.fullPath + '/',
              },
            })),
          },
          _sum: { size: true },
        });

  return (
    (directFilesSize._sum.size ?? 0) + (descendantFilesSize._sum.size ?? 0)
  );
}

export async function getStatsForUser(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { storageQuota: true, storageUsed: true },
  });
}
