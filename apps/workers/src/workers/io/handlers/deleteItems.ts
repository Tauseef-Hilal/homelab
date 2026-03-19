import { HttpError } from '@homelab/contracts/errors/';
import { CommonErrorCode } from '@homelab/contracts/errors/';
import { DeleteJobPayload, DeleteJobResult } from '@homelab/contracts/jobs';

import { prisma } from '@homelab/db/prisma';
import { getThumbnailPath, release } from '@homelab/storage';
import { Prisma } from '@prisma/client';
import { getJobLogger } from '@workers/utils/logger';
import { Job } from 'bullmq';
import { unlink } from 'fs/promises';
import pLimit from 'p-limit';

const FETCH_BATCH_SIZE = 1000;

type PartialFile = {
  id: string;
  size: number;
  fullPath: string;
  hasThumbnail: boolean;
};

type DeleteContext = {
  freedSize: number;
  deletePaths: string[];
};

export const deleteItems = async (
  job: Job<DeleteJobPayload>,
): Promise<DeleteJobResult> => {
  try {
    const logger = getJobLogger('io-worker', job);
    const { userId, items } = job.data;

    const ctx: DeleteContext = {
      freedSize: 0,
      deletePaths: [],
    };

    const { folderIds, fileIds } = splitItems(items);
    const { files, folders } = await fetchTargets(userId, fileIds, folderIds);

    await deleteFilesInBatches(userId, files, folders, ctx);
    await deleteFolders(userId, folders);
    await release(userId, ctx.freedSize);
    await deletePhysicalFiles(ctx.deletePaths);

    return { deletedAt: new Date().toISOString() };
  } catch (err) {
    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete items',
        });
  }
};

function splitItems(items: DeleteJobPayload['items']) {
  const folderIds: string[] = [];
  const fileIds: string[] = [];

  items.forEach((item) => {
    if (item.type === 'file') fileIds.push(item.id);
    else folderIds.push(item.id);
  });

  return { folderIds, fileIds };
}

async function fetchTargets(
  userId: string,
  fileIds: string[],
  folderIds: string[],
) {
  const files = await prisma.file.findMany({
    where: { id: { in: fileIds }, userId },
    select: { fullPath: true },
  });

  const folders = await prisma.folder.findMany({
    where: { id: { in: folderIds }, userId },
    select: { fullPath: true },
  });

  return { files, folders };
}

async function deleteFilesInBatches(
  userId: string,
  files: { fullPath: string }[],
  folders: { fullPath: string }[],
  ctx: DeleteContext,
) {
  const startsWithFolderPrefixes = folders.map((folder) => ({
    fullPath: { startsWith: folder.fullPath + '/' },
  }));

  const equalsFileFullPath = files.map((file) => ({
    fullPath: file.fullPath,
  }));

  let cursor: string | null | undefined = undefined;

  do {
    const batch: PartialFile[] = await prisma.file.findMany({
      where: {
        userId,
        OR: [...equalsFileFullPath, ...startsWithFolderPrefixes],
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      select: { id: true, size: true, fullPath: true, hasThumbnail: true },
      take: FETCH_BATCH_SIZE + 1,
    });

    const hasMore = batch.length > FETCH_BATCH_SIZE;
    if (hasMore) batch.pop();

    const batchFileIds: string[] = [];

    batch.forEach((file) => {
      batchFileIds.push(file.id);
      ctx.freedSize += file.size;

      // queue thumbnails for deletion
      if (file.hasThumbnail)
        ctx.deletePaths.push(getThumbnailPath(userId, file.id));
    });

    await removeBatch(batchFileIds, ctx);

    cursor = hasMore ? batch[batch.length - 1].id : null;
  } while (cursor);
}

async function removeBatch(batchFileIds: string[], ctx: DeleteContext) {
  await prisma.$transaction(async (tx) => {
    const updatedBlobs = await tx.$queryRaw<
      { id: string; refCount: number; storageKey: string }[]
    >`
      UPDATE "Blob"
      SET "refCount" = GREATEST("refCount" - counts.count, 0)
      FROM (
        SELECT "blobId", COUNT(*) as count
        FROM "FileChunk"
        WHERE "fileId" IN (${Prisma.join(batchFileIds)})
        GROUP BY "blobId"
      ) counts
      WHERE "Blob"."id" = counts."blobId"
      RETURNING "Blob"."id", "Blob"."refCount", "Blob"."storageKey"
    `;

    await tx.file.deleteMany({ where: { id: { in: batchFileIds } } });

    const blobIds: string[] = [];

    updatedBlobs.forEach((b) => {
      if (b.refCount <= 0) {
        blobIds.push(b.id);
        ctx.deletePaths.push(b.storageKey);
      }
    });

    await tx.blob.deleteMany({ where: { id: { in: blobIds } } });
  });
}

async function deleteFolders(userId: string, folders: { fullPath: string }[]) {
  const startsWithFolderPrefixes = folders.map((folder) => ({
    fullPath: { startsWith: folder.fullPath + '/' },
  }));

  const equalToFolderPrefixes = folders.map((folder) => ({
    fullPath: folder.fullPath,
  }));

  await prisma.folder.deleteMany({
    where: {
      userId,
      OR: [...equalToFolderPrefixes, ...startsWithFolderPrefixes],
    },
  });
}

async function deletePhysicalFiles(paths: string[]) {
  const limit = pLimit(10);

  await Promise.all(
    paths.map((p) =>
      limit(async () => {
        try {
          await unlink(p);
        } catch (err) {
          console.error('Failed to delete file', p, err);
        }
      }),
    ),
  );
}
