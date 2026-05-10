import { Job } from 'bullmq';
import { prisma } from '@homelab/db/prisma';
import { File, Folder, Prisma } from '@prisma/client';
import { MoveJobPayload, MoveJobResult } from '@homelab/contracts/jobs';
import { getJobLogger } from '@workers/utils/logger';
import {
  assertBulkPermission,
  hasPermission,
  pathJoin,
  resolveAccess,
  resolveFileName,
  resolveFolderName,
} from '@homelab/storage';
import {
  CommonErrorCode,
  HttpError,
  StorageErrorCode,
} from '@homelab/contracts/errors';
import { FilePermission } from '@homelab/storage/constants';

type FileUpdate = {
  id: string;
  newName: string;
  newFolderId: string;
  newFullPath: string;
  newDepth: number;
};

const BATCH_SIZE = 1000;

export const moveItems = async (
  job: Job<MoveJobPayload>,
): Promise<MoveJobResult> => {
  try {
    const logger = getJobLogger('io-worker', job);
    const { userId, shareToken, items, destFolderId } = job.data;
    const { fileIds, folderIds, newNameMap } = splitItemIds(items);
    const { files, folders } = await fetchItems(fileIds, folderIds);
    const destFolder = await getDestinationFolder(
      destFolderId,
      userId,
      shareToken,
    );

    // --- Permissions Check for Source Items ---
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

    // We require WRITE access to move items,
    // since we are modifying their paths
    await assertBulkPermission(
      sourceItemsToCheck,
      { userId, token: shareToken },
      FilePermission.WRITE,
    );

    const sourceOwnerIds = new Set(sourceItemsToCheck.map((item) => item.userId));
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

    const existingNames = getExistingNames(destFolder);

    await moveFolders({
      folders,
      destFolder,
      newNameMap,
      existingNames,
    });

    const updates = await prepareFileUpdates({
      files,
      destFolder,
      newNameMap,
      existingNames,
    });

    await applyFileUpdates(updates);

    return { movedAt: new Date().toISOString() };
  } catch (err) {
    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to move items',
        });
  }
};

async function getDestinationFolder(
  destFolderId: string,
  userId: string,
  token: string | undefined,
) {
  const folder = await prisma.folder.findUnique({
    where: { id: destFolderId },
    include: {
      children: { select: { name: true } },
      files: { select: { name: true } },
    },
  });

  if (!folder) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'Destination folder doesnt exist',
    });
  }

  // Ensure user has WRITE permission to the destination
  const destAccess = await resolveAccess(
    { ...folder, type: 'folder' },
    {
      userId,
      token,
    },
  );

  if (!destAccess || !hasPermission(destAccess, FilePermission.WRITE)) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.UNAUTHORIZED,
      message: 'You do not have permission to write to the destination folder',
    });
  }

  return folder;
}

function splitItemIds(items: MoveJobPayload['items']) {
  const fileIds: string[] = [];
  const folderIds: string[] = [];
  const newNameMap = new Map<string, string | undefined>();

  for (const item of items) {
    if (item.type === 'file') fileIds.push(item.id);
    else folderIds.push(item.id);

    newNameMap.set(item.id, item.newName);
  }

  return { fileIds, folderIds, newNameMap };
}

async function fetchItems(fileIds: string[], folderIds: string[]) {
  const [files, folders] = await Promise.all([
    prisma.file.findMany({ where: { id: { in: fileIds } } }),
    prisma.folder.findMany({ where: { id: { in: folderIds } } }),
  ]);

  return { files, folders };
}

function getExistingNames(
  destFolder: Folder & {
    children: { name: string }[];
    files: { name: string }[];
  },
) {
  const existingNames = new Set<string>();

  destFolder.children.forEach((f) => existingNames.add(f.name));
  destFolder.files.forEach((f) => existingNames.add(f.name));

  return existingNames;
}

async function moveFolders({
  folders,
  destFolder,
  newNameMap,
  existingNames,
}: {
  folders: Folder[];
  destFolder: Folder;
  newNameMap: Map<string, string | undefined>;
  existingNames: Set<string>;
}) {
  for (const folder of folders) {
    // prevent moving folder into itself or its descendants
    if (
      folder.fullPath === destFolder.fullPath ||
      destFolder.fullPath.startsWith(folder.fullPath + '/')
    ) {
      throw new HttpError({
        status: 400,
        code: StorageErrorCode.INVALID_OPERATION,
        message: 'Cannot copy a folder into itself or its subfolder',
      });
    }

    const { resolvedName } = await resolveFolderName({
      name: newNameMap.get(folder.id) ?? folder.name,
      existingNames,
      parentPath: destFolder.fullPath,
    });

    existingNames.add(resolvedName);

    const oldPrefix = folder.fullPath;
    const newPrefix = pathJoin(destFolder.fullPath, resolvedName);

    await prisma.$transaction(async (tx) => {
      const depthDiff = destFolder.depth + 1 - folder.depth;

      await tx.folder.update({
        where: { id: folder.id },
        data: {
          name: resolvedName,
          fullPath: newPrefix,
          parentId: destFolder.id,
          depth: { increment: depthDiff },
        },
      });

      // update paths of descendant folders
      await tx.$executeRaw`
        UPDATE "Folder"
        SET "fullPath" =
          ${newPrefix} || substring("fullPath" from ${oldPrefix.length + 1}::int),
            depth = depth + ${depthDiff}
        WHERE (
          "fullPath" LIKE ${oldPrefix + '/%'}
        )
      `;

      // update paths of files inside moved folder
      await tx.$executeRaw`
        UPDATE "File"
        SET "fullPath" =
          ${newPrefix} || substring("fullPath" from ${oldPrefix.length + 1}::int),
            depth = depth + ${depthDiff}
        WHERE (
          "fullPath" = ${oldPrefix} OR
          "fullPath" LIKE ${oldPrefix + '/%'}
        )
      `;
    });
  }
}

async function prepareFileUpdates({
  files,
  destFolder,
  newNameMap,
  existingNames,
}: {
  files: File[];
  destFolder: Folder;
  newNameMap: Map<string, string | undefined>;
  existingNames: Set<string>;
}): Promise<FileUpdate[]> {
  const updates: FileUpdate[] = [];

  for (const file of files) {
    const { resolvedName } = await resolveFileName({
      name: newNameMap.get(file.id) ?? file.name,
      existingNames,
      parentPath: destFolder.fullPath,
    });

    existingNames.add(resolvedName);

    updates.push({
      id: file.id,
      newName: resolvedName,
      newFolderId: destFolder.id,
      newFullPath: pathJoin(destFolder.fullPath, resolvedName),
      newDepth: destFolder.depth + 1,
    });
  }

  return updates;
}

async function applyFileUpdates(updates: FileUpdate[]) {
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const chunk = updates.slice(i, i + BATCH_SIZE);

      await tx.$executeRaw`
        UPDATE "File" f
        SET
          "name" = v."newName",
          "fullPath" = v."newFullPath",
          "folderId" = v."newFolderId",
          "depth" = v."newDepth"::int
        FROM (
          VALUES ${Prisma.join(
            chunk.map(
              (u) =>
                Prisma.sql`(${u.id}, ${u.newName}, ${u.newFullPath}, ${u.newFolderId}, ${u.newDepth})`,
            ),
          )}
        ) AS v("id", "newName", "newFullPath", "newFolderId", "newDepth")
        WHERE f."id" = v."id";
      `;
    }
  });
}
