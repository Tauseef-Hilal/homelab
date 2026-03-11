import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

import { File, Visibility } from '@prisma/client';

import { prisma } from '@homelab/shared/prisma';
import { redis, RedisKeys } from '@homelab/shared/redis';

import {
  copyFileOnDisk,
  getFileExtension,
  getFileNameWithoutExtension,
  getOriginalFilePath,
  getThumbnailPath,
  pathJoin,
  resolveFileName,
  resolveFolderName,
  calculateSize,
  reserve,
  release,
} from '@homelab/shared/utils/';

import { HttpError } from '@homelab/shared/errors';
import { CommonErrorCode } from '@homelab/shared/errors';
import { StorageErrorCode } from '@homelab/shared/errors';

import { validateFolderCopyPaths } from '@workers/utils/storage';

import { CopyJobPayload, CopyJobResult } from '@homelab/shared/jobs/';

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

type FolderMeta = {
  id: string;
  name: string;
  userId: string;
  parentId: string;
  fullPath: string;
};

type CopyArgs = {
  src: string;
  dest: string;
};

export const copyItems = async ({
  prismaJobId,
  userId,
  items,
  destFolderId,
}: CopyJobPayload): Promise<CopyJobResult> => {
  let copySize = 0;
  let processed: CopyArgs[] = [];

  try {
    const fileIds: string[] = [];
    const folderIds: string[] = [];

    // Separate file and folder IDs for size calculation
    items.forEach((item) =>
      item.type === 'file' ? fileIds.push(item.id) : folderIds.push(item.id),
    );

    // Calculate total size and reserve user quota
    copySize = await calculateSize(fileIds, folderIds);
    await reserve(userId, copySize);

    const fileMeta: FileMeta[] = [];
    const folderMeta: FolderMeta[] = [];
    const copyArgs: CopyArgs[] = [];

    // Build a copy plan for every item
    for (const item of items) {
      if (item.type === 'folder') {
        await copyFolder(
          userId,
          item.id,
          destFolderId,
          fileMeta,
          folderMeta,
          copyArgs,
        );
      } else {
        await copyFile(userId, item.id, destFolderId, fileMeta, copyArgs);
      }
    }

    // Periodically update job progress in Redis
    const progressInterval = setInterval(async () => {
      const progress = Math.floor((processed.length / copyArgs.length) * 100);
      redis.setex(RedisKeys.jobs.progress(prismaJobId), 60, progress);
    }, 100);

    // Execute planned disk copy operations
    for (const arg of copyArgs) {
      await copyFileOnDisk(arg.src, arg.dest);
      processed.push(arg);
    }

    clearInterval(progressInterval);

    // Persist folders and files in a single transaction
    await prisma.$transaction(async (tx) => {
      await tx.folder.createMany({ data: folderMeta });
      await tx.file.createMany({ data: fileMeta });
    });

    return { copiedAt: new Date().toISOString() };
  } catch (err: any) {
    // Release reserved quota and clean up partially copied files
    if (
      'code' in err &&
      err.code !== StorageErrorCode.QUOTA_EXCEEDED &&
      err.code !== StorageErrorCode.SERVER_LIMIT_EXCEEDED
    ) {
      await release(userId, copySize);

      for (const copyArg of processed) {
        await unlink(copyArg.dest);
      }
    }

    console.error(err);

    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to copy items',
        });
  }
};

export async function copyFile(
  userId: string,
  fileId: string,
  targetFolderId: string,
  fileMeta: FileMeta[],
  copyArgs: CopyArgs[],
) {
  // Fetch the source file metadata
  const srcFile = await prisma.file.findUnique({ where: { id: fileId } });
  if (!srcFile) throw new Error('File does not exist');

  // Resolve unique filename/path in destination
  const { newFileName, newFilePath } = await resolveFileName(
    srcFile,
    getFileNameWithoutExtension(srcFile.name),
    targetFolderId,
    true,
  );

  // Get destination folder path
  const folder = await prisma.folder.findUnique({
    where: { id: targetFolderId },
  });

  // Plan the file copy operation
  await planFileCopy(
    userId,
    srcFile,
    targetFolderId,
    folder!.fullPath,
    fileMeta,
    copyArgs,
    newFileName,
    newFilePath,
  );
}

export async function copyFolder(
  userId: string,
  srcFolderId: string,
  destFolderId: string,
  fileMeta: FileMeta[],
  folderMeta: FolderMeta[],
  copyArgs: CopyArgs[],
) {
  // Fetch source and destination folders
  const [srcFolder, destFolder] = await Promise.all([
    prisma.folder.findUnique({ where: { id: srcFolderId } }),
    prisma.folder.findUnique({ where: { id: destFolderId } }),
  ]);

  if (!srcFolder || !destFolder) throw new Error('Folders do not exist');

  // Prevent copying folder into its own subtree
  validateFolderCopyPaths(srcFolder.fullPath, destFolder.fullPath);

  // Resolve unique folder name
  const resolvedName = await resolveFolderName(
    srcFolder,
    srcFolder.name,
    destFolderId,
    true,
  );

  const newFolderId = randomUUID();
  const newFolderPath = pathJoin(destFolder.fullPath, resolvedName);

  // Store folder metadata for later DB insertion
  folderMeta.push({
    id: newFolderId,
    name: resolvedName,
    userId,
    parentId: destFolderId,
    fullPath: newFolderPath,
  });

  // Recursively copy folder contents
  await copyFolderContents(
    userId,
    srcFolderId,
    newFolderId,
    newFolderPath,
    fileMeta,
    folderMeta,
    copyArgs,
  );
}

async function copyFolderContents(
  userId: string,
  srcFolderId: string,
  destFolderId: string,
  destFolderPath: string,
  fileMeta: FileMeta[],
  folderMeta: FolderMeta[],
  copyArgs: CopyArgs[],
) {
  // Fetch folder contents
  const srcFolder = await prisma.folder.findUnique({
    where: { id: srcFolderId },
    include: { files: true, children: true },
  });

  if (!srcFolder) return;

  // Copy all files inside this folder
  for (const file of srcFolder.files) {
    await planFileCopy(
      userId,
      file,
      destFolderId,
      destFolderPath,
      fileMeta,
      copyArgs,
    );
  }

  // Recursively copy all child folders
  for (const child of srcFolder.children) {
    const newChildId = randomUUID();
    const newChildPath = pathJoin(destFolderPath, child.name);

    folderMeta.push({
      id: newChildId,
      name: child.name,
      userId,
      parentId: destFolderId,
      fullPath: newChildPath,
    });

    await copyFolderContents(
      userId,
      child.id,
      newChildId,
      newChildPath,
      fileMeta,
      folderMeta,
      copyArgs,
    );
  }
}

async function planFileCopy(
  userId: string,
  file: File,
  folderId: string,
  folderPath: string,
  fileMeta: FileMeta[],
  copyArgs: CopyArgs[],
  resolvedName?: string,
  resolvedPath?: string,
) {
  const newFileId = randomUUID();
  const ext = getFileExtension(file.name);

  // Determine final file name and path
  const name = resolvedName ?? file.name;
  const fullPath = resolvedPath ?? pathJoin(folderPath, name);

  // Plan original file copy operation
  copyArgs.push({
    src: getOriginalFilePath(file.userId, file.id, ext),
    dest: getOriginalFilePath(userId, newFileId, ext),
  });

  // Plan thumbnail copy if available
  const srcThumb = getThumbnailPath(file.userId, file.id);

  if (file.hasThumbnail && existsSync(srcThumb)) {
    copyArgs.push({
      src: srcThumb,
      dest: getThumbnailPath(userId, newFileId),
    });
  }

  // Store metadata for later DB creation
  fileMeta.push({
    id: newFileId,
    name,
    mimeType: file.mimeType,
    size: file.size,
    folderId,
    fullPath,
    visibility: file.visibility,
    userId,
    hasThumbnail: file.hasThumbnail,
  });
}
