import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Folder, Prisma } from '@prisma/client';
import { FilePermission, OWNER_PERMISSIONS } from '../constants';
import { CommonErrorCode, HttpError } from '@homelab/contracts/errors';
import { prisma } from '@homelab/db/prisma';

/* -------------------------------------------------------------------------- */
/*                                  FILE NAMES                                */
/* -------------------------------------------------------------------------- */

export function getFileNameWithoutExtension(name: string) {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? name : name.slice(0, idx);
}

export function splitNameAndExtension(name: string) {
  const idx = name.lastIndexOf('.');
  return idx === -1
    ? { base: name, ext: '' }
    : { base: name.slice(0, idx), ext: name.slice(idx) };
}

export function getFileExtension(filename: string) {
  return path.extname(filename).replace('.', '').toLowerCase();
}

/* -------------------------------------------------------------------------- */
/*                            DROPBOX STYLE NAMING                            */
/* -------------------------------------------------------------------------- */

function resolveDuplicateName(
  baseName: string,
  ext: string,
  names: Set<string>,
) {
  const original = `${baseName}${ext}`;

  if (!names.has(original)) {
    return original;
  }

  let counter = 1;
  let finalName: string;

  do {
    finalName = `${baseName} (${counter})${ext}`;
    counter++;
  } while (names.has(finalName));

  return finalName;
}

/* -------------------------------------------------------------------------- */
/*                              FILE NAME RESOLVER                            */
/* -------------------------------------------------------------------------- */

type ResolveFileNameOptions =
  | {
      name: string;
      destFolderId: string;
      existingNames?: never;
      parentPath?: never;
    }
  | {
      name: string;
      existingNames: Set<string>;
      parentPath: string;
      destFolderId?: never;
    };

type ResolvedFileName = {
  resolvedName: string;
  resolvedPath: string;
};

export async function resolveFileName(
  options: ResolveFileNameOptions,
): Promise<ResolvedFileName> {
  const { name } = options;

  let names: Set<string>;
  let parentPath = '';

  if (options.existingNames) {
    names = options.existingNames;
    parentPath = options.parentPath;
  } else if (options.destFolderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: options.destFolderId },
      select: {
        fullPath: true,
        files: { select: { name: true } },
      },
    });

    parentPath = folder?.fullPath ?? '';
    names = new Set(folder?.files.map((f) => f.name));
  } else {
    throw new Error('Invalid options');
  }

  const ext = path.extname(name);
  const base = path.basename(name, ext);

  const finalName = resolveDuplicateName(base, ext, names);

  return {
    resolvedName: finalName,
    resolvedPath: pathJoin(parentPath, finalName),
  };
}

/* -------------------------------------------------------------------------- */
/*                             FOLDER NAME RESOLVER                           */
/* -------------------------------------------------------------------------- */

type ResolveFolderNameOptions =
  | {
      name: string;
      destFolderId: string | null;
      existingNames?: never;
      parentPath?: never;
    }
  | {
      name: string;
      existingNames: Set<string>;
      parentPath: string;
      destFolderId?: never;
    };

type ResolvedFolderName = {
  resolvedName: string;
  resolvedPath: string;
};

export async function resolveFolderName(
  options: ResolveFolderNameOptions,
): Promise<ResolvedFolderName> {
  const { name } = options;

  let names: Set<string>;
  let parentPath = '';

  if (options.existingNames) {
    names = options.existingNames;
    parentPath = options.parentPath;
  } else if (options.destFolderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: options.destFolderId! },
      select: {
        fullPath: true,
        children: { select: { name: true } },
      },
    });

    parentPath = folder?.fullPath ?? '';
    names = new Set(folder?.children.map((f) => f.name));
  } else {
    throw new Error('Invalid options');
  }

  const finalName = resolveDuplicateName(name, '', names);

  return {
    resolvedName: finalName,
    resolvedPath: pathJoin(parentPath, finalName),
  };
}

/* -------------------------------------------------------------------------- */
/*                                   PATHS                                    */
/* -------------------------------------------------------------------------- */

export function pathJoin(parent: string, child: string) {
  return path.join(parent, child);
}

/* -------------------------------------------------------------------------- */
/*                                FILE COPYING                                */
/* -------------------------------------------------------------------------- */

export async function copyFileOnDisk(src: string, dest: string) {
  await pipeline(createReadStream(src), createWriteStream(dest));
}

/* -------------------------------------------------------------------------- */
/*                              SECURITY HELPERS                              */
/* -------------------------------------------------------------------------- */

export function ensureFolderExists(
  folder: Folder | null,
  errMsg = 'Folder does not exist',
): asserts folder is Folder {
  if (!folder) {
    throw new Error(errMsg);
  }
}

export function ensureUserIsOwner(
  folder: Folder,
  userId: string,
  errMsg = 'You do not have the permission to perform this action',
) {
  if (folder.userId !== userId) {
    throw new Error(errMsg);
  }
}

/* ------------------------------------------------------------------------- */
/*                                 PERMISSIONS                               */
/* ------------------------------------------------------------------------- */
export type EntityType = 'file' | 'folder';

export interface AccessItem {
  id: string;
  type: EntityType;
  userId: string;
  fullPath: string;
}

export type AccessContext = {
  userId: string | null;
  token: string | undefined;
};

export const hasPermission = (mask: number, perm: FilePermission) => {
  if (mask === OWNER_PERMISSIONS) return true;
  return (mask & perm) === perm;
};

export const addPermission = (mask: number, perm: FilePermission) => {
  if (mask === OWNER_PERMISSIONS) return mask;
  return mask | perm;
};

export const removePermission = (mask: number, perm: FilePermission) => {
  if (mask === OWNER_PERMISSIONS) return mask;
  return mask & ~perm;
};

export const isValidLink = (expiresAt: Date | null) => {
  return !expiresAt || expiresAt > new Date();
};

function getAncestorPaths(fullPath: string): string[] {
  const segments = fullPath.split('/');
  const paths: string[] = [];

  for (let i = 0; i < segments.length - 1; i++) {
    const path = segments.slice(0, i + 1).join('/');
    paths.push(path ? path : '/');
  }

  return paths;
}

async function resolveBulkUserShares(
  items: AccessItem[],
  userId: string | null,
  db: Prisma.TransactionClient,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!userId || items.length === 0) return map;

  const now = new Date();

  // Separate IDs to query both files and folders safely
  const fileIds = items.filter((i) => i.type === 'file').map((i) => i.id);
  const folderIds = items.filter((i) => i.type === 'folder').map((i) => i.id);

  const directConditions: any[] = [];
  if (fileIds.length > 0) directConditions.push({ fileId: { in: fileIds } });
  if (folderIds.length > 0)
    directConditions.push({ folderId: { in: folderIds } });

  // Bulk Direct Query
  const directShares =
    directConditions.length > 0
      ? await db.userShare.findMany({
          where: {
            userId: userId,
            OR: directConditions,
          },
        })
      : [];

  const itemsWithoutDirectShare: AccessItem[] = [];

  for (const item of items) {
    const directMatch = directShares.find(
      (s) => s.fileId === item.id || s.folderId === item.id,
    );

    if (directMatch) {
      map.set(item.id, directMatch.permissions);
    } else {
      itemsWithoutDirectShare.push(item);
    }
  }

  // Bulk Inherited Query
  if (itemsWithoutDirectShare.length > 0) {
    // all items in the batch share the same ancestor path
    const ancestors = getAncestorPaths(items[0].fullPath);
    let inheritedPerms = 0;

    if (ancestors.length > 0) {
      const inheritedShare = await db.$queryRaw<{ permissions: number }[]>`
        SELECT s."permissions" 
        FROM "UserShare" s
        INNER JOIN "Folder" f ON s."folderId" = f."id"
        WHERE s."userId" = ${userId} 
          AND f."fullPath" IN (${Prisma.join(ancestors)})
        ORDER BY LENGTH(f."fullPath") DESC
        LIMIT 1
      `;

      inheritedPerms = inheritedShare[0]?.permissions || 0;
    }

    // Apply the closest inherited permission to all remaining items
    for (const item of itemsWithoutDirectShare) {
      map.set(item.id, inheritedPerms);
    }
  }

  return map;
}

async function resolveBulkLinkShares(
  items: AccessItem[],
  token: string | undefined,
  db: Prisma.TransactionClient,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!token || items.length === 0) return map;

  // Fetch the single token record, including the folder path for inheritance
  const linkShare = await db.linkShare.findUnique({
    where: { token },
    include: { folder: { select: { id: true, fullPath: true } } },
  });

  if (!linkShare || !isValidLink(linkShare.expiresAt)) {
    return map;
  }

  const targetFileId = linkShare.fileId;
  const targetFolderId = linkShare.folderId;
  const targetFolderPath = linkShare.folder?.fullPath;

  // Resolve all items against this single valid grant securely
  for (const item of items) {
    if (targetFileId) {
      // Must be an exact file match
      if (item.id === targetFileId) {
        map.set(item.id, linkShare.permissions);
      }
    } else if (targetFolderId && targetFolderPath) {
      // Must be an exact folder match OR a child of that folder
      if (
        item.id === targetFolderId ||
        item.fullPath.startsWith(targetFolderPath + '/')
      ) {
        map.set(item.id, linkShare.permissions);
      }
    }
  }

  return map;
}

export async function resolveAccessBulk(
  items: AccessItem[],
  ctx: AccessContext,
  db: Prisma.TransactionClient = prisma,
): Promise<Map<string, number>> {
  const accessMap = new Map<string, number>();
  if (items.length === 0) return accessMap;

  const nonOwned: AccessItem[] = [];

  // Fast Path: Ownership
  for (const item of items) {
    if (ctx.userId && item.userId === ctx.userId) {
      accessMap.set(item.id, OWNER_PERMISSIONS);
    } else {
      nonOwned.push(item);
    }
  }

  if (nonOwned.length === 0) return accessMap;

  // Fire both independent tracks concurrently
  const [userMap, linkMap] = await Promise.all([
    resolveBulkUserShares(nonOwned, ctx.userId, db),
    resolveBulkLinkShares(nonOwned, ctx.token, db),
  ]);

  // Merge independent vectors
  for (const item of nonOwned) {
    const userPerms = userMap.get(item.id) ?? 0;
    const linkPerms = linkMap.get(item.id) ?? 0;

    accessMap.set(item.id, userPerms | linkPerms);
  }

  return accessMap;
}

export async function resolveAccess(
  item: AccessItem,
  ctx: AccessContext,
  db: Prisma.TransactionClient = prisma,
): Promise<number> {
  const map = await resolveAccessBulk([item], ctx, db);
  return map.get(item.id) ?? 0;
}

export async function assertBulkPermission(
  items: AccessItem[],
  ctx: AccessContext,
  requiredPermission: FilePermission,
  db: Prisma.TransactionClient = prisma,
): Promise<void> {
  if (items.length === 0) return;

  const accessMap = await resolveAccessBulk(items, ctx, db);
  const unauthorizedItems: AccessItem[] = [];

  for (const item of items) {
    const itemPermissions = accessMap.get(item.id) || 0;

    if (!hasPermission(itemPermissions, requiredPermission)) {
      unauthorizedItems.push(item);
    }
  }

  if (unauthorizedItems.length > 0) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.UNAUTHORIZED,
      message: `Action denied: You lack the required permissions for ${unauthorizedItems.length} selected item(s).`,
    });
  }
}
