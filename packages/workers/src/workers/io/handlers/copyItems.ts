import { CopyJobPayload } from '@shared/jobs/payload.types';
import { prisma } from '@shared/prisma';
import { randomUUID } from 'crypto';
import {
  copyFileOnDisk,
  getFileExtension,
  getFileNameWithoutExtension,
  getOriginalFilePath,
  getThumbnailPath,
  pathJoin,
  resolveFileName,
  resolveFolderName,
} from '@shared/utils/storage.utils';
import { existsSync } from 'fs';

export const copyItems = async ({
  prismaJobId,
  userId,
  items,
  destFolderId,
}: CopyJobPayload) => {
  let processed = 0;

  for (const item of items) {
    if (item.type === 'folder') {
      await copyFolder(userId, item.id, destFolderId);
    } else {
      await copyFile(userId, item.id, destFolderId);
    }

    processed++;
    await prisma.job.update({
      where: { id: prismaJobId },
      data: { progress: (processed / items.length) * 100 },
    });
  }

  return { copiedAt: new Date().toISOString() };
};

export async function copyFile(
  userId: string,
  fileId: string,
  targetFolderId: string | null = null
) {
  const srcFile = await prisma.file.findUnique({ where: { id: fileId } });
  if (!srcFile) throw new Error('File does not exist');

  try {
    const newFileId = randomUUID();
    const ext = getFileExtension(srcFile.name);

    // Copy main file
    await copyFileOnDisk(
      getOriginalFilePath(srcFile.userId, fileId, ext),
      getOriginalFilePath(userId, newFileId, ext)
    );

    // Copy thumbnail if exists
    const srcThumb = getThumbnailPath(srcFile.userId, fileId);
    if (srcFile.hasThumbnail && existsSync(srcThumb)) {
      await copyFileOnDisk(srcThumb, getThumbnailPath(userId, newFileId));
    }

    // Resolve new unique name/path
    const { newFileName, newFilePath } = await resolveFileName(
      srcFile,
      getFileNameWithoutExtension(srcFile.name),
      targetFolderId,
      true
    );

    // Create DB entry
    return await prisma.file.create({
      data: {
        id: newFileId,
        name: newFileName,
        mimeType: srcFile.mimeType,
        size: srcFile.size,
        folderId: targetFolderId,
        fullPath: newFilePath,
        visibility: srcFile.visibility,
        userId,
        hasThumbnail: srcFile.hasThumbnail,
      },
    });
  } catch (err) {
    throw new Error(`Failed to copy file: ${(err as Error).message}`);
  }
}

export async function copyFolder(
  userId: string,
  srcFolderId: string,
  destFolderId: string
) {
  const [srcFolder, destFolder] = await Promise.all([
    prisma.folder.findUnique({ where: { id: srcFolderId } }),
    prisma.folder.findUnique({ where: { id: destFolderId } }),
  ]);

  if (!srcFolder || !destFolder) throw new Error('Folders do not exist');

  // Prevent copying into own subtree
  validateFolderCopyPaths(srcFolder.fullPath, destFolder.fullPath);

  // Resolve new folder name
  const resolvedName = await resolveFolderName(
    srcFolder,
    srcFolder.name,
    destFolderId,
    true
  );

  // Create destination folder
  const newFolder = await prisma.folder.create({
    data: {
      name: resolvedName,
      userId,
      parentId: destFolderId,
      fullPath: pathJoin(destFolder.fullPath, resolvedName),
    },
  });

  // Recursively copy contents
  await copyFolderContents(userId, srcFolderId, newFolder.id);
}

async function copyFolderContents(
  userId: string,
  srcFolderId: string,
  destFolderId: string
) {
  const srcFolder = await prisma.folder.findUnique({
    where: { id: srcFolderId },
    include: { files: true, children: true },
  });
  if (!srcFolder) return;

  // Copy all files in folder
  await Promise.all(
    srcFolder.files.map((file) => copyFileToFolder(userId, file, destFolderId))
  );

  // Recursively copy subfolders
  await Promise.all(
    srcFolder.children.map(async (child) => {
      const newChild = await prisma.folder.create({
        data: {
          name: child.name,
          userId,
          parentId: destFolderId,
          fullPath: `${pathJoin(
            (await prisma.folder.findUnique({ where: { id: destFolderId } }))!
              .fullPath,
            child.name
          )}`,
        },
        select: { id: true },
      });
      await copyFolderContents(userId, child.id, newChild.id);
    })
  );
}

async function copyFileToFolder(
  userId: string,
  file: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    hasThumbnail: boolean;
    userId: string;
  },
  destFolderId: string
) {
  const newFileId = randomUUID();
  const ext = getFileExtension(file.name);

  // Copy original
  await copyFileOnDisk(
    getOriginalFilePath(file.userId, file.id, ext),
    getOriginalFilePath(userId, newFileId, ext)
  );

  // Copy thumbnail if applicable
  if (file.hasThumbnail) {
    await copyFileOnDisk(
      getThumbnailPath(file.userId, file.id),
      getThumbnailPath(userId, newFileId)
    );
  }

  const destFolder = await prisma.folder.findUnique({
    where: { id: destFolderId },
    select: { fullPath: true },
  });

  return prisma.file.create({
    data: {
      id: newFileId,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      userId,
      folderId: destFolderId,
      fullPath: `${destFolder?.fullPath}/${file.name}`,
      hasThumbnail: file.hasThumbnail,
    },
  });
}

function validateFolderCopyPaths(srcPath: string, destPath: string) {
  const normalize = (p: string) => p.replace(/\/+$/, '');
  const src = normalize(srcPath);
  const dest = normalize(destPath);

  if (dest === src || dest.startsWith(src + '/')) {
    throw new Error('Cannot copy a folder into its own subtree.');
  }
}
