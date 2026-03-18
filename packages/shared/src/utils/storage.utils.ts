import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { env } from '@homelab/shared/config';
import { prisma } from '@homelab/shared/prisma';
import { Folder } from '@prisma/client';
import { Readable } from 'stream';

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
/*                                MEDIA PATHS                                 */
/* -------------------------------------------------------------------------- */

export function getThumbnailsDirPath(userId: string) {
  return path.join(path.resolve(env.THUMBNAIL_DIR_PATH), userId);
}

export function getThumbnailPath(userId: string, fileId: string) {
  return path.join(getThumbnailsDirPath(userId), `${fileId}.webp`);
}

export function getTempFilePath(fileName: string) {
  return path.join(path.resolve(env.TEMP_DIR_PATH), fileName);
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

/* -------------------------------------------------------------------------- */
/*                                CHUNK STORAGE                               */
/* -------------------------------------------------------------------------- */

export function getBlobStorageKeyByHash(hash: string) {
  const prefix1 = hash.slice(0, 2);
  const prefix2 = hash.slice(2, 4);

  return path.join(prefix1, prefix2, hash);
}

export function getBlobStoragePathByKey(storageKey: string) {
  return path.join(env.BLOB_DIR_PATH, storageKey);
}

type GetFileStreamInput = {
  chunks: {
    size: number;
    blob: {
      storageKey: string;
    };
  }[];
};

type RangeOptions = {
  start?: number;
  end?: number;
};

export function getFileStream(
  file: GetFileStreamInput,
  range?: RangeOptions,
): Readable {
  const start = range?.start ?? 0;
  // If no end is provided, read until the end of the last chunk
  const end = range?.end ?? Infinity;

  async function* generateFileChunks() {
    let currentOffset = 0;

    for (const chunk of file?.chunks ?? []) {
      const chunkStart = currentOffset;
      const chunkEnd = currentOffset + chunk.size - 1; // Inclusive end

      currentOffset += chunk.size;

      if (chunkEnd < start) continue;
      if (chunkStart > end) break;

      // Calculate the relative slice within this specific chunk
      const relativeStart = Math.max(0, start - chunkStart);
      const relativeEnd = Math.min(chunk.size - 1, end - chunkStart);

      const storagePath = getBlobStoragePathByKey(chunk.blob.storageKey);

      // Yield the specific byte range for this chunk's file
      yield* createReadStream(storagePath, {
        start: relativeStart,
        end: relativeEnd,
      });
    }
  }

  return Readable.from(generateFileChunks());
}
