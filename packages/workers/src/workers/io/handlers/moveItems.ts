import { File, Folder, Prisma } from '@prisma/client';
import { MoveJobPayload, MoveJobResult } from '@homelab/shared/jobs';
import { prisma } from '@homelab/shared/prisma';
import {
  pathJoin,
  resolveFileName,
  resolveFolderName,
} from '@homelab/shared/utils';
import {
  CommonErrorCode,
  HttpError,
  StorageErrorCode,
} from '@homelab/shared/errors';
import { Job } from 'bullmq';
import { getJobLogger } from '@workers/utils/logger';

type FileUpdate = {
  id: string;
  newName: string;
  newFolderId: string;
  newFullPath: string;
};

const BATCH_SIZE = 1000;

export const moveItems = async (
  job: Job<MoveJobPayload>,
): Promise<MoveJobResult> => {
  try {
    const logger = getJobLogger('io-worker', job);
    const { userId, items, destFolderId } = job.data;
    const { fileIds, folderIds, newNameMap } = splitItemIds(items);
    const { files, folders } = await fetchItems(fileIds, folderIds);
    const destFolder = await getDestinationFolder(destFolderId);
    const existingNames = getExistingNames(destFolder);

    await moveFolders({
      folders,
      destFolder,
      newNameMap,
      existingNames,
      userId,
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

async function getDestinationFolder(destFolderId: string) {
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
  userId,
}: {
  folders: Folder[];
  destFolder: Folder;
  newNameMap: Map<string, string | undefined>;
  existingNames: Set<string>;
  userId: string;
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
      await tx.folder.update({
        where: { userId, id: folder.id },
        data: {
          name: resolvedName,
          fullPath: newPrefix,
          parentId: destFolder.id,
        },
      });

      // update paths of descendant folders
      await tx.$executeRaw`
        UPDATE "Folder"
        SET "fullPath" =
          ${newPrefix} || substring("fullPath" from ${oldPrefix.length + 1}::int)
        WHERE (
          "fullPath" = ${oldPrefix} OR
          "fullPath" LIKE ${oldPrefix + '/%'}
        ) AND "userId" = ${userId}
      `;

      // update paths of files inside moved folder
      await tx.$executeRaw`
        UPDATE "File"
        SET "fullPath" =
          ${newPrefix} || substring("fullPath" from ${oldPrefix.length + 1}::int)
        WHERE (
          "fullPath" = ${oldPrefix} OR
          "fullPath" LIKE ${oldPrefix + '/%'}
        ) AND "userId" = ${userId}
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
          "folderId" = v."newFolderId"
        FROM (
          VALUES ${Prisma.join(
            chunk.map(
              (u) =>
                Prisma.sql`(${u.id}, ${u.newName}, ${u.newFullPath}, ${u.newFolderId})`,
            ),
          )}
        ) AS v("id", "newName", "newFullPath", "newFolderId")
        WHERE f."id" = v."id";
      `;
    }
  });
}
