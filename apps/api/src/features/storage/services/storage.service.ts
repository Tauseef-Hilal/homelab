import { randomUUID } from 'crypto';
import { Folder } from '@prisma/client';
import { prisma } from '@homelab/db/prisma';
import { getStorageProvider } from '@homelab/infra';
import { FilePermission, OWNER_PERMISSIONS } from '@homelab/storage/constants';
import {
  resolveAccess,
  hasPermission,
  AccessItem,
  resolveAccessBulk,
} from '@homelab/storage';
import { HttpError, CommonErrorCode } from '@homelab/contracts/errors';
import { resolveFolderName } from '../utils/folder.util';
import { pathJoin } from '../utils/file.util';

export async function createFolder(
  reqUserId: string,
  shareToken: string | undefined,
  folderName: string,
  parentId: string | null,
) {
  let parent: Folder | null = null;

  if (parentId) {
    // Fetch parent without restricting by userId
    parent = await prisma.folder.findUnique({ where: { id: parentId } });

    if (!parent) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: 'Parent folder does not exist',
      });
    }

    // Ensure the user has WRITE access to the parent folder
    const accessItem: AccessItem = {
      id: parent.id,
      type: 'folder',
      userId: parent.userId,
      fullPath: parent.fullPath,
    };

    const access = await resolveAccess(accessItem, {
      userId: reqUserId,
      token: shareToken,
    });

    if (!access || !hasPermission(access, FilePermission.WRITE)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.FORBIDDEN,
        message:
          'Forbidden: You do not have permission to create a folder here',
      });
    }
  }

  const folderId = randomUUID();
  const ownerId = parent ? parent.userId : reqUserId;

  const resolvedName = await resolveFolderName(
    {
      id: folderId,
      name: folderName,
      userId: ownerId,
    },
    folderName,
    parentId,
  );

  return await prisma.$transaction(async (tx) => {
    const folder = await tx.folder.create({
      data: {
        name: resolvedName,
        userId: ownerId,
        depth: (parent?.depth ?? 0) + 1,
        fullPath: pathJoin(parent?.fullPath, resolvedName),
        parentId: parent?.id || null,
      },
    });

    // Give owner perms to reqUserId
    if (ownerId != reqUserId) {
      await tx.userShare.create({
        data: {
          folderId: folder.id,
          userId: reqUserId,
          permissions: OWNER_PERMISSIONS,
        },
      });
    }

    return folder;
  });
}

export async function listDirectory(
  reqUserId: string,
  shareToken: string | undefined,
  path: string,
  ownerId?: string,
) {
  // Default to the requester's own file system if no specific
  // owner is provided
  const targetUserId = ownerId || reqUserId;

  const folder = await prisma.folder.findUnique({
    where: {
      userId_fullPath: {
        userId: targetUserId,
        fullPath: path,
      },
    },
    include: {
      files: true,
      children: true,
    },
  });

  if (!folder) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'Folder not found',
    });
  }

  // Ensure the user has READ access to view the contents
  const accessItem: AccessItem = {
    id: folder.id,
    type: 'folder',
    userId: folder.userId,
    fullPath: folder.fullPath,
  };

  const access = await resolveAccess(accessItem, {
    userId: reqUserId,
    token: shareToken,
  });

  if (!access || !hasPermission(access, FilePermission.READ)) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: 'Forbidden: You do not have access to view this folder',
    });
  }

  return {
    ...folder,
    permissions: {
      read: hasPermission(access, FilePermission.READ),
      write: hasPermission(access, FilePermission.WRITE),
      copy: hasPermission(access, FilePermission.COPY),
      share: hasPermission(access, FilePermission.SHARE),
      delete: hasPermission(access, FilePermission.DELETE),
    },
  };
}

export async function listSharedItems(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: "User doesn't exist",
    });
  }

  const userShares = await prisma.userShare.findMany({
    where: {
      userId,
    },
    select: {
      folder: true,
      file: true,
    },
  });

  const folders = userShares
    .map((s) => s.folder)
    .filter((f): f is NonNullable<typeof f> => f !== null);

  const files = userShares
    .map((s) => s.file)
    .filter((f): f is NonNullable<typeof f> => f !== null);

  // Sort folders by shortest path first
  const sortedFolders = [...folders].sort(
    (a, b) => a.fullPath.length - b.fullPath.length,
  );

  // Keep only top-level unique folders
  const uniqueFolders = sortedFolders.filter((folder, index, arr) => {
    return !arr
      .slice(0, index)
      .some(
        (existing) =>
          folder.fullPath === existing.fullPath ||
          folder.fullPath.startsWith(existing.fullPath + '/'),
      );
  });

  // Remove files covered by any returned folder
  const uniqueFiles = files.filter((file) => {
    return !uniqueFolders.some(
      (folder) =>
        file.fullPath === folder.fullPath ||
        file.fullPath.startsWith(folder.fullPath + '/'),
    );
  });

  return {
    folders: uniqueFolders,
    files: uniqueFiles,
  };
}

export async function getLinkItem(shareToken: string) {
  const linkShare = await prisma.linkShare.findUnique({
    where: { token: shareToken },
    include: { file: true, folder: true },
  });

  if (!linkShare) {
    throw new HttpError({
      code: CommonErrorCode.NOT_FOUND,
      status: 404,
      message: 'Resource not found',
    });
  }

  if (linkShare.expiresAt && linkShare.expiresAt.getTime() <= Date.now()) {
    throw new HttpError({
      code: CommonErrorCode.GONE,
      status: 410,
      message: 'Share link has expired',
    });
  }

  return {
    folders: linkShare.folder ? [linkShare.folder] : [],
    files: linkShare.file ? [linkShare.file] : [],
  };
}

export async function validateLinkAndGetDownloadMeta(linkId: string) {
  const link = await prisma.downloadLink.findUnique({ where: { id: linkId } });
  const storage = getStorageProvider();

  if (!link || (link && !(await storage.artifacts.exists(link.artifactKey)))) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'The resource does not exist',
    });
  }

  if (Date.now() > link.expiresAt.getTime()) {
    throw new HttpError({
      status: 410,
      code: CommonErrorCode.GONE,
      message: 'Download link has expired',
    });
  }

  return {
    fileStream: storage.artifacts.openRead(link.artifactKey),
    fileName: link.displayName,
  };
}

export async function getFileMeta(
  reqUserId: string,
  shareToken: string | undefined,
  fileId: string,
) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      userId: true,
      fullPath: true,
      name: true,
      mimeType: true,
      size: true,
      chunks: {
        orderBy: { chunkIndex: 'asc' },
        select: {
          size: true,
          blob: { select: { blobKey: true, size: true } },
        },
      },
    },
  });

  if (!file) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'File does not exist.',
    });
  }

  // Resolve Access through our bitmask engine
  const accessItem: AccessItem = {
    id: file.id,
    type: 'file',
    userId: file.userId,
    fullPath: file.fullPath,
  };

  const access = await resolveAccess(accessItem, {
    userId: reqUserId,
    token: shareToken,
  });

  // Ensure the user has READ permission to stream this file
  if (!access || !hasPermission(access, FilePermission.READ)) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: 'You do not have permission to view or download this file',
    });
  }

  return file;
}
