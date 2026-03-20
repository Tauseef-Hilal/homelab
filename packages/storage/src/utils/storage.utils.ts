import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { env } from '@homelab/infra/config';
import { prisma } from '@homelab/db/prisma';
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
