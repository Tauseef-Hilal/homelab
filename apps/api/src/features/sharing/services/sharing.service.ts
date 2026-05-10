import crypto from 'crypto';
import { prisma } from '@homelab/db';
import { CommonErrorCode, HttpError } from '@homelab/contracts';
import {
  hasPermission,
  resolveAccess,
  EntityType,
  AccessItem,
} from '@homelab/storage';
import { FilePermission } from '@homelab/storage/constants';

export async function shareWithUser(
  reqUserId: string,
  userEmail: string,
  itemId: string,
  permissions: number,
) {
  await prisma.$transaction(async (tx) => {
    const [file, folder, targetUser] = await Promise.all([
      tx.file.findUnique({ where: { id: itemId } }),
      tx.folder.findUnique({ where: { id: itemId } }),
      tx.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      }),
    ]);

    const item = file ?? folder;

    if (!item) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: 'File or folder not found',
      });
    }

    if (!targetUser) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: 'User not found',
      });
    }

    // Prevent self-share
    if (targetUser.id === reqUserId) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'Cannot self share',
      });
    }

    // Prevent sharing with the owner
    if (targetUser.id === item.userId) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.BAD_REQUEST,
        message: 'User is already the owner of this item',
      });
    }

    // Resolve Access
    const accessItem: AccessItem = {
      id: item.id,
      type: file ? 'file' : 'folder',
      userId: item.userId,
      fullPath: item.fullPath,
    };

    const access = await resolveAccess(
      accessItem,
      { userId: reqUserId, token: undefined },
      tx,
    );

    if (!access || !hasPermission(access, FilePermission.SHARE)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message: 'Forbidden',
      });
    }

    // Prevent permission escalation
    if ((permissions & access) !== permissions) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message: 'Cannot grant higher permissions than you have',
      });
    }

    if (file) {
      await tx.userShare.upsert({
        where: { fileId_userId: { fileId: file.id, userId: targetUser.id } },
        update: { permissions },
        create: { userId: targetUser.id, fileId: file.id, permissions },
      });
    } else if (folder) {
      await tx.userShare.upsert({
        where: {
          folderId_userId: { folderId: folder.id, userId: targetUser.id },
        },
        update: { permissions },
        create: { userId: targetUser.id, folderId: folder.id, permissions },
      });
    }
  });
}

export async function getUserShares(reqUserId: string, itemId: string) {
  const [file, folder] = await Promise.all([
    prisma.file.findUnique({ where: { id: itemId } }),
    prisma.folder.findUnique({ where: { id: itemId } }),
  ]);

  const item = file ?? folder;

  if (!item) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'File or folder not found',
    });
  }

  const accessItem: AccessItem = {
    id: item.id,
    type: file ? 'file' : 'folder',
    userId: item.userId,
    fullPath: item.fullPath,
  };

  const access = await resolveAccess(accessItem, {
    userId: reqUserId,
    token: undefined,
  });

  if (!access || !hasPermission(access, FilePermission.SHARE)) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.UNAUTHORIZED,
      message: 'Forbidden: You cannot view shares for this item',
    });
  }

  // DRY query structure
  return await prisma.userShare.findMany({
    where: file ? { fileId: itemId } : { folderId: itemId },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      permissions: true,
      user: { select: { id: true, username: true, email: true } },
    },
  });
}

export async function revokeUserShare(
  reqUserId: string,
  userEmail: string,
  itemId: string,
) {
  await prisma.$transaction(async (tx) => {
    const [file, folder, targetUser] = await Promise.all([
      tx.file.findUnique({ where: { id: itemId } }),
      tx.folder.findUnique({ where: { id: itemId } }),
      tx.user.findUnique({ where: { email: userEmail }, select: { id: true } }),
    ]);

    const item = file ?? folder;
    if (!item || !targetUser) return;

    // Verify the requester has permission to manage shares on this item
    const accessItem: AccessItem = {
      id: item.id,
      type: file ? 'file' : 'folder',
      userId: item.userId,
      fullPath: item.fullPath,
    };

    const access = await resolveAccess(
      accessItem,
      { userId: reqUserId, token: undefined },
      tx,
    );

    if (!access || !hasPermission(access, FilePermission.SHARE)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message: 'Forbidden: You cannot modify shares for this item',
      });
    }

    // Safely remove the share
    if (file) {
      await tx.userShare.deleteMany({
        where: { fileId: file.id, userId: targetUser.id },
      });
    } else {
      await tx.userShare.deleteMany({
        where: { folderId: folder?.id, userId: targetUser.id },
      });
    }
  });
}

export async function shareLink(
  reqUserId: string,
  itemId: string,
  permissions: number,
  expiry: number | null,
) {
  // Generate a cryptographically secure, URL-safe 32-character token
  const token = crypto.randomBytes(24).toString('base64url');

  await prisma.$transaction(async (tx) => {
    const [file, folder] = await Promise.all([
      tx.file.findUnique({ where: { id: itemId } }),
      tx.folder.findUnique({ where: { id: itemId } }),
    ]);

    const item = file ?? folder;

    if (!item) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: 'File or folder not found',
      });
    }

    // Resolve Access (Ensure the creator has SHARE permission)
    const accessItem: AccessItem = {
      id: item.id,
      type: file ? 'file' : 'folder',
      userId: item.userId,
      fullPath: item.fullPath,
    };

    const access = await resolveAccess(
      accessItem,
      { userId: reqUserId, token: undefined },
      tx,
    );

    if (!access || !hasPermission(access, FilePermission.SHARE)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message: 'Forbidden',
      });
    }

    // Prevent permission escalation
    if ((permissions & access) !== permissions) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message: 'Cannot grant higher permissions than you have',
      });
    }

    await tx.linkShare.create({
      data: {
        fileId: file ? file.id : undefined,
        folderId: folder ? folder.id : undefined,
        token,
        permissions,
        expiresAt: expiry ? new Date(expiry) : null,
      },
    });
  });

  return { token };
}

export async function updateLink(
  reqUserId: string,
  token: string,
  permissions: number,
  expiry: number | null,
) {
  await prisma.$transaction(async (tx) => {
    const link = await tx.linkShare.findUnique({
      where: { token },
      include: { file: true, folder: true },
    });

    if (!link) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: 'Link not found',
      });
    }

    // Since it's either a file or folder share, one of these will be populated
    const item = link.file ?? link.folder;
    if (!item) return;

    // Verify requester still has permission to manage this item
    const accessItem: AccessItem = {
      id: item.id,
      type: link.file ? 'file' : 'folder',
      userId: item.userId,
      fullPath: item.fullPath,
    };

    const access = await resolveAccess(
      accessItem,
      { userId: reqUserId, token: undefined },
      tx,
    );

    if (!access || !hasPermission(access, FilePermission.SHARE)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message: 'Forbidden: You cannot modify this link',
      });
    }

    // Prevent permission escalation
    if ((permissions & access) !== permissions) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message: 'Cannot grant higher permissions than you have',
      });
    }

    // Update the record using the unique token
    await tx.linkShare.update({
      where: { token },
      data: { permissions, expiresAt: expiry ? new Date(expiry) : null },
    });
  });
}

export async function revokeLink(reqUserId: string, token: string) {
  await prisma.$transaction(async (tx) => {
    const link = await tx.linkShare.findUnique({
      where: { token },
      include: { file: true, folder: true },
    });

    // Idempotent exit
    if (!link) return;

    const item = link.file ?? link.folder;
    if (!item) return;

    // Verify the requester has SHARE permission on the underlying item
    const accessItem: AccessItem = {
      id: item.id,
      type: link.file ? 'file' : 'folder',
      userId: item.userId,
      fullPath: item.fullPath,
    };

    const access = await resolveAccess(
      accessItem,
      { userId: reqUserId, token: undefined },
      tx,
    );

    if (!access || !hasPermission(access, FilePermission.SHARE)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.UNAUTHORIZED,
        message:
          'Forbidden: You do not have permission to revoke links for this item',
      });
    }

    // Delete the link record directly by token
    await tx.linkShare.delete({ where: { token } });
  });
}

export async function getSharedLinks(reqUserId: string, itemId: string) {
  const [file, folder] = await Promise.all([
    prisma.file.findUnique({ where: { id: itemId } }),
    prisma.folder.findUnique({ where: { id: itemId } }),
  ]);

  const item = file ?? folder;

  if (!item) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'File or folder not found',
    });
  }

  const accessItem: AccessItem = {
    id: item.id,
    type: file ? 'file' : 'folder',
    userId: item.userId,
    fullPath: item.fullPath,
  };

  const access = await resolveAccess(accessItem, {
    userId: reqUserId,
    token: undefined,
  });

  if (!access || !hasPermission(access, FilePermission.SHARE)) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.UNAUTHORIZED,
      message: 'Forbidden: You cannot view links for this item',
    });
  }

  // DRY query structure
  const shares = await prisma.linkShare.findMany({
    where: file ? { fileId: itemId } : { folderId: itemId },
    orderBy: { createdAt: 'desc' },
  });

  return shares.map((share) => ({
    id: share.id,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
    permissions: share.permissions,
    token: share.token,
  }));
}
