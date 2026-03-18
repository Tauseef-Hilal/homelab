import { randomUUID } from 'crypto';
import { File, Folder, Prisma, Visibility } from '@prisma/client';
import { prisma } from '@homelab/shared/prisma';
import {
  resolveFileName,
  resolveFolderName,
  calculateSize,
  reserve,
  release,
  getThumbnailPath,
  copyFileOnDisk,
  pathJoin,
} from '@homelab/shared/utils/';

import { HttpError, StorageErrorCode } from '@homelab/shared/errors';
import { CommonErrorCode } from '@homelab/shared/errors';
import { CopyJobPayload, CopyJobResult } from '@homelab/shared/jobs/';
import pLimit from 'p-limit';
import { Job } from 'bullmq';
import { getJobLogger } from '@workers/utils/logger';

const FILE_BATCH_SIZE = 1000;
const FOLDER_BATCH_SIZE = 1000;
const SCAN_BATCH_SIZE = 1000;

type FileMeta = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  folderId: string;
  fullPath: string;
  visibility: Visibility;
  userId: string;
  hasThumbnail: boolean;
};

type FileIdMap = {
  oldId: string;
  newId: string;
};

type FolderMeta = {
  id: string;
  name: string;
  userId: string;
  parentId: string;
  fullPath: string;
};

// Consolidated context type
type CopyContext = {
  fileMeta: FileMeta[];
  fileIdMap: FileIdMap[];
  folderMeta: FolderMeta[];
  pendingCopiedSize: number;
};

export const copyItems = async (
  job: Job<CopyJobPayload>,
): Promise<CopyJobResult> => {
  const logger = getJobLogger('io-worker', job);
  const { userId, items, destFolderId } = job.data;

  let totalCopySize = 0;
  let actualCopiedSize = 0;

  const ctx: CopyContext = {
    fileMeta: [],
    fileIdMap: [],
    folderMeta: [],
    pendingCopiedSize: 0,
  };

  try {
    const fileIds: string[] = [];
    const folderIds: string[] = [];

    items.forEach((item) =>
      item.type === 'file' ? fileIds.push(item.id) : folderIds.push(item.id),
    );

    totalCopySize = await calculateSize(fileIds, folderIds);
    await reserve(userId, totalCopySize);

    const destFolder = await prisma.folder.findUnique({
      where: { id: destFolderId, userId },
      include: {
        children: { select: { name: true } },
        files: { select: { name: true } },
      },
    });

    if (!destFolder) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: "Destination folder doesn't exist",
      });
    }

    const flush = async () => {
      if (!ctx.fileMeta.length && !ctx.folderMeta.length) return;

      const batchSize = ctx.fileMeta.reduce((s, f) => s + f.size, 0);

      try {
        await executeCopyTransaction(
          ctx.fileMeta,
          ctx.fileIdMap,
          ctx.folderMeta,
        );

        actualCopiedSize += ctx.pendingCopiedSize;
      } catch (err) {
        ctx.pendingCopiedSize -= batchSize;
        throw err;
      }

      // Thumbnail errors should NOT fail the transaction
      try {
        await copyThumbnails(userId, [...ctx.fileMeta], [...ctx.fileIdMap]);
      } catch (err) {
        logger.error(err, 'Thumbnail copy failed');
      } finally {
        ctx.fileMeta.length = 0;
        ctx.fileIdMap.length = 0;
        ctx.folderMeta.length = 0;
        ctx.pendingCopiedSize = 0;
      }
    };

    const existingNames: Set<string> = new Set();
    destFolder.children.forEach((c) => existingNames.add(c.name));
    destFolder.files.forEach((f) => existingNames.add(f.name));

    await prepareCopyPlan(
      userId,
      fileIds,
      folderIds,
      { ...destFolder, childrenNames: existingNames },
      ctx,
      flush,
    );

    await flush();

    return { copiedAt: new Date().toISOString() };
  } catch (err) {
    // Release the portion that wasn't successfully committed
    await release(userId, totalCopySize - actualCopiedSize);
    logger.error(err);

    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to copy files',
        });
  }
};

async function prepareCopyPlan(
  userId: string,
  fileIds: string[],
  folderIds: string[],
  destFolder: { id: string; fullPath: string; childrenNames: Set<string> },
  ctx: CopyContext,
  flush: () => Promise<void>,
) {
  for (const folderId of folderIds) {
    await copyFolderSubtree(userId, folderId, destFolder, ctx, flush);
  }

  if (fileIds.length) {
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds }, userId },
    });

    for (const file of files) {
      await buildFileCopyPlan(
        file,
        destFolder.id,
        destFolder.fullPath,
        ctx,
        true,
        destFolder.childrenNames,
      );

      if (ctx.fileMeta.length >= FILE_BATCH_SIZE) {
        await flush();
      }
    }
  }
}

async function copyFolderSubtree(
  userId: string,
  rootFolderId: string,
  destFolder: { id: string; fullPath: string; childrenNames: Set<string> },
  ctx: CopyContext,
  flush: () => Promise<void>,
) {
  const root = await prisma.folder.findUnique({
    where: { id: rootFolderId, userId },
    select: { id: true, name: true, fullPath: true, parentId: true },
  });

  if (!root) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'Folder doesnt exist',
    });
  }

  if (
    root.fullPath === destFolder.fullPath ||
    destFolder.fullPath.startsWith(root.fullPath + '/')
  ) {
    throw new HttpError({
      status: 400,
      code: StorageErrorCode.INVALID_OPERATION,
      message: 'Cannot copy a folder into itself or its subfolder',
    });
  }

  const folderIdMap = new Map<string, string>();
  const folderPathMap = new Map<string, string>();

  let cursor: string | null = null;

  do {
    const folders: Folder[] = await prisma.folder.findMany({
      where: {
        userId,
        AND: [
          {
            OR: [
              { id: root.id },
              { fullPath: { startsWith: root.fullPath + '/' } },
            ],
          },
          ...(cursor ? [{ fullPath: { gt: cursor } }] : []),
        ],
      },
      orderBy: { fullPath: 'asc' },
      take: SCAN_BATCH_SIZE + 1,
    });

    const hasMore = folders.length > SCAN_BATCH_SIZE;
    if (hasMore) folders.pop();

    for (const folder of folders) {
      let newName = folder.name;

      if (folder.id === root.id) {
        const { resolvedName } = await resolveFolderName({
          name: folder.name,
          existingNames: destFolder.childrenNames,
          parentPath: destFolder.fullPath,
        });

        newName = resolvedName;
        destFolder.childrenNames.add(resolvedName);
      }

      const newId = randomUUID();
      const parentNewId =
        folder.id === root.id
          ? destFolder.id
          : folderIdMap.get(folder.parentId!)!;

      const parentPath =
        folder.id === root.id
          ? destFolder.fullPath
          : folderPathMap.get(folder.parentId!)!;

      const newPath = pathJoin(parentPath, newName);

      ctx.folderMeta.push({
        id: newId,
        name: newName,
        parentId: parentNewId,
        fullPath: newPath,
        userId,
      });

      folderIdMap.set(folder.id, newId);
      folderPathMap.set(folder.id, newPath);

      if (ctx.folderMeta.length >= FOLDER_BATCH_SIZE) {
        await flush();
      }
    }

    cursor = hasMore ? folders[folders.length - 1].fullPath : null;
  } while (cursor);

  await copyFilesForSubtree(
    userId,
    root,
    folderIdMap,
    folderPathMap,
    ctx,
    flush,
  );
}

async function copyFilesForSubtree(
  userId: string,
  root: { id: string; name: string; fullPath: string; parentId: string | null },
  folderIdMap: Map<string, string>,
  folderPathMap: Map<string, string>,
  ctx: CopyContext,
  flush: () => Promise<void>,
) {
  let cursor: string | null = null;

  do {
    const files: File[] = await prisma.file.findMany({
      where: {
        userId,
        OR: [
          { folderId: root.id },
          { fullPath: { startsWith: root.fullPath + '/' } },
        ],
        ...(cursor ? [{ fullPath: { gt: cursor } }] : []),
      },
      orderBy: { fullPath: 'asc' },
      take: SCAN_BATCH_SIZE + 1,
    });

    const hasMore = files.length > SCAN_BATCH_SIZE;
    if (hasMore) files.pop();

    for (const file of files) {
      const newFolderId = folderIdMap.get(file.folderId)!;
      const newFolderPath = folderPathMap.get(file.folderId)!;

      await buildFileCopyPlan(file, newFolderId, newFolderPath, ctx);

      if (ctx.fileMeta.length >= FILE_BATCH_SIZE) {
        await flush();
      }
    }

    cursor = hasMore ? files[files.length - 1].fullPath : null;
  } while (cursor);
}

async function buildFileCopyPlan(
  file: File,
  destFolderId: string,
  destFolderPath: string,
  ctx: CopyContext,
  resolveNameConflicts: boolean = false,
  existingNames?: Set<string>,
) {
  const newFileId = randomUUID();
  let newFilePath = pathJoin(destFolderPath, file.name);
  let newFileName = file.name;

  if (resolveNameConflicts) {
    const { resolvedName, resolvedPath } = await resolveFileName({
      name: file.name,
      existingNames: existingNames!,
      parentPath: destFolderPath,
    });

    newFileName = resolvedName;
    newFilePath = resolvedPath;
    existingNames?.add(newFileName);
  }

  ctx.fileMeta.push({
    id: newFileId,
    name: newFileName,
    fullPath: newFilePath,
    folderId: destFolderId,
    size: file.size,
    userId: file.userId,
    mimeType: file.mimeType,
    visibility: file.visibility,
    hasThumbnail: file.hasThumbnail,
  });

  ctx.fileIdMap.push({ oldId: file.id, newId: newFileId });
  ctx.pendingCopiedSize += file.size;
}

async function executeCopyTransaction(
  fileMeta: FileMeta[],
  fileIdMap: FileIdMap[],
  folderMeta: FolderMeta[],
) {
  await prisma.$transaction(async (tx) => {
    if (folderMeta.length) {
      await tx.folder.createMany({ data: folderMeta });
    }

    if (fileMeta.length) {
      await tx.file.createMany({ data: fileMeta });

      await tx.$executeRaw`
        INSERT INTO "FileChunk" ("id", "fileId","blobId","chunkIndex","size")
        SELECT
          gen_random_uuid(),
          map."newFileId",
          fc."blobId",
          fc."chunkIndex",
          fc."size"
        FROM "FileChunk" fc
        JOIN (
          VALUES ${Prisma.join(
            fileIdMap.map((m) => Prisma.sql`(${m.oldId}, ${m.newId})`),
          )}
        ) AS map("oldFileId","newFileId")
        ON fc."fileId" = map."oldFileId"
      `;

      await tx.$executeRaw`
        UPDATE "Blob"
        SET "refCount" = "refCount" + counts.count
        FROM (
          SELECT "blobId", COUNT(*) as count
          FROM "FileChunk"
          WHERE "fileId" IN (${Prisma.join(
            fileMeta.map((m) => Prisma.sql`${m.id}`),
          )})
          GROUP BY "blobId"
        ) counts
        WHERE "Blob"."id" = counts."blobId"
      `;
    }
  });
}

async function copyThumbnails(
  userId: string,
  fileMeta: FileMeta[],
  fileIdMap: FileIdMap[],
) {
  const limit = pLimit(10);

  await Promise.all(
    fileMeta.map(async (file, i) =>
      limit(async () => {
        if (!file.hasThumbnail) return;

        const src = getThumbnailPath(userId, fileIdMap[i].oldId);
        const dest = getThumbnailPath(userId, file.id);

        try {
          await copyFileOnDisk(src, dest);
        } catch (err) {
          console.error('Thumbnail copy failed', err);
        }
      }),
    ),
  );
}
