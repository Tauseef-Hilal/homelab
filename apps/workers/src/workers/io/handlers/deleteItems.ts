import { HttpError } from '@homelab/contracts/errors/';
import { CommonErrorCode } from '@homelab/contracts/errors/';
import { DeleteJobPayload, DeleteJobResult } from '@homelab/contracts/jobs';

import { prisma } from '@homelab/db/prisma';
import { getStorageProvider } from '@homelab/infra';
import { release, assertBulkPermission, resolveAccess, hasPermission } from '@homelab/storage';
import { FilePermission } from '@homelab/storage/constants';
import { Prisma } from '@prisma/client';
import { getJobLogger } from '@workers/utils/logger';
import { Job } from 'bullmq';

const FETCH_BATCH_SIZE = 1000;

type PartialFile = {
  id: string;
  size: number;
  fullPath: string;
  hasThumbnail: boolean;
  userId: string;
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
    const { userId, shareToken, items } = job.data;
    if (items.length === 0) {
      return { deletedAt: new Date().toISOString() };
    }

    const ctx: DeleteContext = {
      freedSize: 0,
      deletePaths: [],
    };

    const { folderIds, fileIds } = splitItems(items);
    const { files, folders } = await fetchTargets(fileIds, folderIds);

    const parent = await prisma.folder.findUnique({
      where: { id: files[0]?.folderId ?? folders[0]?.parentId },
    });

    if (!parent) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: "Parent folder doesn't exist",
      });
    }

    const parentAccess = await resolveAccess(
      { ...parent, type: 'folder' },
      {
        userId,
        token: shareToken,
      },
    );

    if (!parentAccess || !hasPermission(parentAccess, FilePermission.WRITE)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message:
          'You do not have permission to write to the destination folder',
      });
    }

    // --- Permissions Check ---
    const sourceItemsToCheck = [
      ...files.map((f) => ({ ...f, type: 'file' as const })),
      ...folders.map((f) => ({ ...f, type: 'folder' as const })),
    ];

    if (sourceItemsToCheck.length !== items.length) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: 'One or more source items do not exist',
      });
    }

    // Require DELETE permission for all requested items
    await assertBulkPermission(
      sourceItemsToCheck,
      { userId, token: shareToken },
      FilePermission.DELETE,
    );

    if (files.length === 0 && folders.length === 0) {
      return { deletedAt: new Date().toISOString() };
    }

    // ---  Execute Deletion ---
    await deleteFilesInBatches(files, folders, ctx);
    await deleteFolders(folders);

    // ---  Release Storage Quotas Correctly ---
    if (ctx.freedSize > 0) {
      await release(parent.userId, ctx.freedSize);
    }

    await deletePhysicalFiles(ctx.deletePaths, logger);

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

async function fetchTargets(fileIds: string[], folderIds: string[]) {
  const files = await prisma.file.findMany({
    where: { id: { in: fileIds } },
    select: { id: true, userId: true, fullPath: true, folderId: true },
  });

  const folders = await prisma.folder.findMany({
    where: { id: { in: folderIds } },
    select: { id: true, userId: true, fullPath: true, parentId: true },
  });

  return { files, folders };
}

async function deleteFilesInBatches(
  files: { fullPath: string }[],
  folders: { fullPath: string }[],
  ctx: DeleteContext,
) {
  const storage = getStorageProvider();

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
        OR: [...equalsFileFullPath, ...startsWithFolderPrefixes],
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        size: true,
        fullPath: true,
        hasThumbnail: true,
        userId: true,
      },
      take: FETCH_BATCH_SIZE + 1,
    });

    const hasMore = batch.length > FETCH_BATCH_SIZE;
    if (hasMore) batch.pop();

    const batchFileIds: string[] = [];

    batch.forEach((file) => {
      batchFileIds.push(file.id);

      // Accumulate freed size grouped by the actual owner
      ctx.freedSize += file.size;

      // queue thumbnails for deletion using the ACTUAL OWNER'S ID
      if (file.hasThumbnail) {
        ctx.deletePaths.push(storage.keys.thumbnail(file.userId, file.id));
      }
    });

    if (batchFileIds.length > 0) {
      await removeBatch(batchFileIds, ctx);
    }

    cursor = hasMore ? batch[batch.length - 1].id : null;
  } while (cursor);
}

async function removeBatch(batchFileIds: string[], ctx: DeleteContext) {
  await prisma.$transaction(async (tx) => {
    const updatedBlobs = await tx.$queryRaw<
      { id: string; refCount: number; blobKey: string }[]
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
      RETURNING "Blob"."id", "Blob"."refCount", "Blob"."blobKey"
    `;

    await tx.file.deleteMany({ where: { id: { in: batchFileIds } } });

    const blobIds: string[] = [];

    updatedBlobs.forEach((b) => {
      if (b.refCount <= 0) {
        blobIds.push(b.id);
        ctx.deletePaths.push(b.blobKey);
      }
    });

    await tx.blob.deleteMany({ where: { id: { in: blobIds } } });
  });
}

async function deleteFolders(folders: { fullPath: string }[]) {
  const startsWithFolderPrefixes = folders.map((folder) => ({
    fullPath: { startsWith: folder.fullPath + '/' },
  }));

  const equalToFolderPrefixes = folders.map((folder) => ({
    fullPath: folder.fullPath,
  }));

  await prisma.folder.deleteMany({
    where: {
      OR: [...equalToFolderPrefixes, ...startsWithFolderPrefixes],
    },
  });
}

async function deletePhysicalFiles(paths: string[], logger: ReturnType<typeof getJobLogger>) {
  const storage = getStorageProvider();
  const uniquePaths = [...new Set(paths)];

  const blobKeys = uniquePaths.filter((p) => p.startsWith('blobs'));
  const thumbnailKeys = uniquePaths.filter((p) => p.startsWith('thumbnails'));

  try {
    if (blobKeys.length > 0) {
      await storage.blobs.deleteMany(blobKeys);
    }
    if (thumbnailKeys.length > 0) {
      await storage.artifacts.deleteMany(thumbnailKeys);
    }
  } catch (err) {
    logger.error(err, 'Failed to delete physical files after DB deletion');
  }
}
