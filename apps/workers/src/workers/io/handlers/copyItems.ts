import { randomUUID } from 'crypto';
import { File, Folder, Prisma, Visibility } from '@prisma/client';
import { prisma } from '@homelab/db/prisma';
import {
  resolveFileName,
  resolveFolderName,
  calculateSize,
  reserve,
  release,
  pathJoin,
  resolveAccess,
  hasPermission,
  assertBulkPermission,
} from '@homelab/storage';

import { HttpError, StorageErrorCode } from '@homelab/contracts/errors';
import { CommonErrorCode } from '@homelab/contracts/errors';
import { CopyJobPayload, CopyJobResult } from '@homelab/contracts/jobs';
import pLimit from 'p-limit';
import { Job } from 'bullmq';
import { getJobLogger } from '@workers/utils/logger';
import { getStorageProvider } from '@homelab/infra';
import { FilePermission } from '@homelab/storage/constants';

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
  depth: number;
  visibility: Visibility;
  userId: string;
  hasThumbnail: boolean;
};

type FileIdMap = {
  oldId: string;
  oldUserId: string;
  newId: string;
};

type FolderMeta = {
  id: string;
  name: string;
  userId: string;
  parentId: string;
  fullPath: string;
  depth: number;
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
  const { userId, shareToken, items, destFolderId } = job.data;

  let totalCopySize = 0;
  let actualCopiedSize = 0;

  const ctx: CopyContext = {
    fileMeta: [],
    fileIdMap: [],
    folderMeta: [],
    pendingCopiedSize: 0,
  };

  let destFolder:
    | (Folder & {
        children: { name: string }[];
        files: { name: string }[];
      })
    | null = null;

  try {
    const fileIds: string[] = [];
    const folderIds: string[] = [];

    items.forEach((item) =>
      item.type === 'file' ? fileIds.push(item.id) : folderIds.push(item.id),
    );

    destFolder = await prisma.folder.findUnique({
      where: { id: destFolderId },
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

    const destAccess = await resolveAccess(
      { ...destFolder, type: 'folder' },
      {
        userId,
        token: shareToken,
      },
    );

    if (!destAccess || !hasPermission(destAccess, FilePermission.WRITE)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message:
          'You do not have permission to write to the destination folder',
      });
    }

    // Fetch the fullPath and owner of the source items for the bulk check
    const [sourceFiles, sourceFolders] = await Promise.all([
      fileIds.length > 0
        ? prisma.file.findMany({
            where: { id: { in: fileIds } },
          })
        : Promise.resolve([]),
      folderIds.length > 0
        ? prisma.folder.findMany({
            where: { id: { in: folderIds } },
          })
        : Promise.resolve([]),
    ]);

    const sourceItemsToCheck = [
      ...sourceFiles.map((f) => ({ ...f, type: 'file' as const })),
      ...sourceFolders.map((f) => ({ ...f, type: 'folder' as const })),
    ];

    // Sanity check: Ensure all requested items actually exist in the DB
    if (sourceItemsToCheck.length !== items.length) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: 'One or more source items do not exist',
      });
    }

    // Ensure user has READ permission on all source items
    await assertBulkPermission(
      sourceItemsToCheck,
      { userId, token: shareToken },
      FilePermission.COPY,
    );

    const sourceOwnerIds = new Set(
      sourceItemsToCheck.map((item) => item.userId),
    );
    if (sourceOwnerIds.size !== 1) {
      throw new HttpError({
        status: 400,
        code: StorageErrorCode.INVALID_OPERATION,
        message: 'All source items must belong to the same owner',
      });
    }

    const [srcOwnerId] = sourceOwnerIds;
    if (srcOwnerId !== destFolder.userId) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.FORBIDDEN,
        message: 'You dont have the permission to perform this operation',
      });
    }

    totalCopySize = await calculateSize(fileIds, folderIds);
    await reserve(destFolder.userId, totalCopySize);

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
        await copyThumbnails(
          destFolder!.userId,
          [...ctx.fileMeta],
          [...ctx.fileIdMap],
        );
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
      destFolder.userId,
      sourceFiles,
      sourceFolders,
      { ...destFolder, childrenNames: existingNames },
      ctx,
      flush,
    );

    await flush();

    return { copiedAt: new Date().toISOString() };
  } catch (err) {
    // Release the portion that wasn't successfully committed
    const unreleased = totalCopySize - actualCopiedSize;
    if (destFolder?.userId && unreleased > 0) {
      await release(destFolder.userId, unreleased);
    }
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
  ownerId: string,
  sourceFiles: File[],
  sourceFolders: Folder[],
  destFolder: {
    id: string;
    fullPath: string;
    depth: number;
    childrenNames: Set<string>;
  },
  ctx: CopyContext,
  flush: () => Promise<void>,
) {
  for (const folder of sourceFolders) {
    await copyFolderSubtree(ownerId, folder, destFolder, ctx, flush);
  }

  if (sourceFiles.length) {
    for (const file of sourceFiles) {
      await buildFileCopyPlan(
        ownerId,
        file,
        destFolder.id,
        destFolder.fullPath,
        destFolder.depth,
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
  ownerId: string,
  root: Folder,
  destFolder: {
    id: string;
    fullPath: string;
    depth: number;
    childrenNames: Set<string>;
  },
  ctx: CopyContext,
  flush: () => Promise<void>,
) {
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
  const folderDepthMap = new Map<string, number>();

  let cursor: string | null = null;

  do {
    const folders: Folder[] = await prisma.folder.findMany({
      where: {
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

      const parentDepth =
        folder.id === root.id
          ? destFolder.depth
          : folderDepthMap.get(folder.parentId!)!;

      const newPath = pathJoin(parentPath, newName);
      const newDepth = parentDepth + 1;

      ctx.folderMeta.push({
        id: newId,
        name: newName,
        parentId: parentNewId,
        fullPath: newPath,
        depth: newDepth,
        userId: ownerId,
      });

      folderIdMap.set(folder.id, newId);
      folderPathMap.set(folder.id, newPath);
      folderDepthMap.set(folder.id, newDepth);

      if (ctx.folderMeta.length >= FOLDER_BATCH_SIZE) {
        await flush();
      }
    }

    cursor = hasMore ? folders[folders.length - 1].fullPath : null;
  } while (cursor);

  await copyFilesForSubtree(
    ownerId,
    root,
    folderIdMap,
    folderPathMap,
    folderDepthMap,
    ctx,
    flush,
  );
}

async function copyFilesForSubtree(
  ownerId: string,
  root: Folder,
  folderIdMap: Map<string, string>,
  folderPathMap: Map<string, string>,
  folderDepthMap: Map<string, number>,
  ctx: CopyContext,
  flush: () => Promise<void>,
) {
  let cursor: string | null = null;

  do {
    const files: File[] = await prisma.file.findMany({
      where: {
        AND: [
          {
            OR: [
              { folderId: root.id },
              { fullPath: { startsWith: root.fullPath + '/' } },
            ],
          },
          ...(cursor ? [{ fullPath: { gt: cursor } }] : []),
        ],
      },
      orderBy: { fullPath: 'asc' },
      take: SCAN_BATCH_SIZE + 1,
    });

    const hasMore = files.length > SCAN_BATCH_SIZE;
    if (hasMore) files.pop();

    for (const file of files) {
      const destFolderId = folderIdMap.get(file.folderId)!;
      const destFolderPath = folderPathMap.get(file.folderId)!;
      const destFolderDepth = folderDepthMap.get(file.folderId)!;

      await buildFileCopyPlan(
        ownerId,
        file,
        destFolderId,
        destFolderPath,
        destFolderDepth,
        ctx,
      );

      if (ctx.fileMeta.length >= FILE_BATCH_SIZE) {
        await flush();
      }
    }

    cursor = hasMore ? files[files.length - 1].fullPath : null;
  } while (cursor);
}

async function buildFileCopyPlan(
  ownerId: string,
  file: File,
  destFolderId: string,
  destFolderPath: string,
  destFolderDepth: number,
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
    depth: destFolderDepth + 1,
    size: file.size,
    userId: ownerId,
    mimeType: file.mimeType,
    visibility: file.visibility,
    hasThumbnail: file.hasThumbnail,
  });

  ctx.fileIdMap.push({
    oldId: file.id,
    oldUserId: file.userId,
    newId: newFileId,
  });
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
  const storage = getStorageProvider();

  await Promise.all(
    fileMeta.map(async (file, i) =>
      limit(async () => {
        if (!file.hasThumbnail) return;

        const src = storage.keys.thumbnail(
          fileIdMap[i].oldUserId,
          fileIdMap[i].oldId,
        );
        const dest = storage.keys.thumbnail(userId, file.id);

        try {
          await storage.artifacts.copy(src, dest);
        } catch (err) {
          console.error('Thumbnail copy failed', err);
        }
      }),
    ),
  );
}
