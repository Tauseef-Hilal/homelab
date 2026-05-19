import {
  CommonErrorCode,
  HttpError,
  StorageErrorCode,
} from '@homelab/contracts/errors';
import { jobNames } from '@homelab/contracts/jobs';
import { prisma } from '@homelab/db/prisma';
import { requestSchemas } from '@homelab/contracts/schemas/storage';
import {
  release,
  reserve,
  resolveFileName,
  resolveAccess,
  hasPermission,
} from '@homelab/storage';
import { FilePermission, OWNER_PERMISSIONS } from '@homelab/storage/constants';
import { UploadStatus, Visibility } from '@prisma/client';
import { enqueueThumbnailJob } from '@server/lib/jobs/thumbnailQueue';
import { randomUUID, createHash } from 'crypto';
import {
  MAX_CONCURRENT_UPLOADS,
  MAX_FILE_SIZE,
  UPLOAD_EXPIRY,
} from '../constants/limits';
import { enqueueUploadCleanupJob } from '@server/lib/jobs/fileIOQueue';
import { getStorageProvider } from '@homelab/infra';

/**
 * Initializes a new upload session or returns existing one
 */
export async function initUpload(
  reqUserId: string,
  input: requestSchemas.UploadInitInput & { uploadId: string },
) {
  const { name, mimeType, folderId, totalSize, totalChunks, uploadId } = input;

  if (totalSize > MAX_FILE_SIZE) {
    throw new HttpError({
      status: 413,
      code: StorageErrorCode.FILE_TOO_LARGE,
      message: 'Upload file exceeds the maximum allowed size',
    });
  }

  const count = await prisma.uploadSession.aggregate({
    where: { userId: reqUserId, status: UploadStatus.active },
    _count: {
      id: true,
    },
  });

  if (count._count.id >= MAX_CONCURRENT_UPLOADS) {
    throw new HttpError({
      status: 429,
      code: CommonErrorCode.RATE_LIMITED,
      message: 'Too many uploads in progress. Try again later',
    });
  }

  let ownerId = '';
  let quotaReserved = false;

  try {
    // Fetch the required fields for the permission check
    const parent = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, depth: true, fullPath: true, userId: true },
    });

    if (!parent) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: 'Destination folder does not exist',
      });
    }

    // Ensure the user has WRITE permission to upload into this folder
    const access = await resolveAccess(
      { ...parent, type: 'folder' },
      { userId: reqUserId, token: input.shareToken },
    );

    if (!access || !hasPermission(access, FilePermission.WRITE)) {
      throw new HttpError({
        status: 403,
        code: CommonErrorCode.FORBIDDEN,
        message:
          'Forbidden: You do not have permission to upload to this folder',
      });
    }

    const existingSession = await prisma.uploadSession.findUnique({
      where: { id: uploadId, userId: reqUserId },
      select: {
        status: true,
        totalChunks: true,
        totalSize: true,
        file: {
          select: { id: true, folderId: true, mimeType: true },
        },
      },
    });

    if (existingSession) {
      if (!existingSession.file) {
        throw new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Upload session is missing its file record',
        });
      }

      if (existingSession.status === UploadStatus.cancelled) {
        throw new HttpError({
          status: 400,
          code: CommonErrorCode.BAD_REQUEST,
          message: 'Upload session was cancelled',
        });
      }

      if (existingSession.status === UploadStatus.expired) {
        throw new HttpError({
          status: 410,
          code: StorageErrorCode.UPLOAD_EXPIRED,
          message: 'Upload session expired',
        });
      }

      const paramsMismatch =
        existingSession.totalChunks !== totalChunks ||
        existingSession.totalSize !== totalSize ||
        existingSession.file.folderId !== folderId ||
        existingSession.file.mimeType !== mimeType;

      if (paramsMismatch) {
        throw new HttpError({
          status: 400,
          code: CommonErrorCode.BAD_REQUEST,
          message: 'Upload id conflicts with different upload parameters',
        });
      }

      return { fileId: existingSession.file.id, uploadId };
    }

    ownerId = parent.userId;
    await reserve(ownerId, totalSize);
    quotaReserved = true;

    const fileId = randomUUID();
    const { resolvedName, resolvedPath } = await resolveFileName({
      name,
      destFolderId: folderId,
    });

    await prisma.$transaction(async (tx) => {
      const session = await tx.uploadSession.create({
        data: {
          id: uploadId,
          totalChunks,
          totalSize,
          uploadedChunks: 0,
          status: UploadStatus.active,
          expiresAt: new Date(Date.now() + UPLOAD_EXPIRY),
          userId: reqUserId,
          file: {
            create: {
              id: fileId,
              name: resolvedName,
              size: totalSize,
              fullPath: resolvedPath,
              depth: parent.depth + 1,
              visibility: Visibility.private,
              folderId,
              mimeType,
              userId: ownerId,
            },
          },
        },
        include: { file: true },
      });

      // Give perms to reqUserId
      if (ownerId != reqUserId) {
        await tx.userShare.create({
          data: {
            fileId: session.file?.id,
            userId: reqUserId,
            permissions: OWNER_PERMISSIONS,
          },
        });
      }
    });

    return { fileId, uploadId };
  } catch (err: unknown) {
    const errCode =
      err instanceof HttpError
        ? err.code
        : err &&
            typeof err === 'object' &&
            'code' in err &&
            typeof (err as { code: unknown }).code === 'string'
          ? (err as { code: string }).code
          : undefined;

    const isLimitError =
      errCode === StorageErrorCode.QUOTA_EXCEEDED ||
      errCode === StorageErrorCode.SERVER_LIMIT_EXCEEDED;

    if (quotaReserved && !isLimitError) {
      await release(ownerId, totalSize);
    }
    console.error(err);
    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to initialize upload',
        });
  }
}

/**
 * Bulk resolves which chunks are already stored on the server
 */
export async function resolveExistingChunks(
  userId: string,
  { fileId, uploadId, chunks }: requestSchemas.UploadChunkCheckInput,
) {
  await validateUploadSession(uploadId, userId);

  const chunkByIndex = new Map<number, (typeof chunks)[number]>();
  for (const c of chunks) {
    if (!chunkByIndex.has(c.index)) chunkByIndex.set(c.index, c);
  }
  const dedupedChunks = [...chunkByIndex.values()];

  const chunkHashes = [...new Set(dedupedChunks.map((c) => c.hash))];
  const existingBlobs = await prisma.blob.findMany({
    where: { hash: { in: chunkHashes } },
    select: { id: true, hash: true },
  });

  if (existingBlobs.length === 0) {
    return { missingChunks: dedupedChunks.map((c) => c.index) };
  }

  const blobByHash = new Map(existingBlobs.map((b) => [b.hash, b]));

  const fileChunks = dedupedChunks
    .filter((chunk) => blobByHash.has(chunk.hash))
    .map((chunk) => {
      const blob = blobByHash.get(chunk.hash)!;
      return {
        fileId,
        blobId: blob.id,
        chunkIndex: chunk.index,
        size: chunk.size,
      };
    });

  const missingChunks = dedupedChunks
    .filter((c) => !blobByHash.has(c.hash))
    .map((c) => c.index);

  // Pre-filter chunks that are already associated with this file to avoid transaction abortion
  const existingFileChunks = await prisma.fileChunk.findMany({
    where: {
      fileId,
      chunkIndex: { in: fileChunks.map((fc) => fc.chunkIndex) },
    },
    select: { chunkIndex: true },
  });

  const existingIndices = new Set(existingFileChunks.map((fc) => fc.chunkIndex));
  const newFileChunks = fileChunks.filter(
    (fc) => !existingIndices.has(fc.chunkIndex),
  );

  // Link existing blobs to the new file in a single transaction
  await prisma.$transaction(async (tx) => {
    if (newFileChunks.length === 0) return;

    const blobDelta = new Map<string, number>();

    for (const fc of newFileChunks) {
      await tx.fileChunk.create({ data: fc });
      blobDelta.set(fc.blobId, (blobDelta.get(fc.blobId) ?? 0) + 1);
    }

    await tx.uploadSession.update({
      where: { id: uploadId },
      data: { uploadedChunks: { increment: newFileChunks.length } },
    });

    await Promise.all(
      [...blobDelta.entries()].map(([blobId, delta]) =>
        tx.blob.update({
          where: { id: blobId },
          data: { refCount: { increment: delta } },
        }),
      ),
    );
  });

  return { missingChunks };
}

/**
 * Processes and saves an individual file chunk
 */
export async function saveChunk(
  userId: string,
  chunkBuffer: Buffer,
  headers: requestSchemas.UploadChunkHeaderInput,
) {
  const fileId = headers['file-id'];
  const uploadId = headers['upload-id'];
  const chunkIndex = headers['chunk-index'];
  const chunkHash = headers['chunk-hash'];

  const session = await validateUploadSession(uploadId, userId);

  if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
    throw new HttpError({
      status: 400,
      code: StorageErrorCode.INVALID_CHUNK_INDEX,
      message: 'Invalid chunk index',
    });
  }

  // Verify data integrity before writing to disk
  const computedHash = createHash('sha256').update(chunkBuffer).digest('hex');
  if (computedHash !== chunkHash) {
    throw new HttpError({
      status: 400,
      code: StorageErrorCode.INVALID_CHUNK_HASH,
      message: 'Chunk hash mismatch',
    });
  }

  const storageProvider = getStorageProvider();
  const blobKey = storageProvider.keys.blob(chunkHash);

  // Store blob
  await storageProvider.blobs.putIfAbsent(blobKey, chunkBuffer);

  await prisma.$transaction(async (tx) => {
    let blobId: string;

    try {
      const newBlob = await tx.blob.create({
        data: {
          hash: chunkHash,
          blobKey: blobKey,
          size: chunkBuffer.length,
          refCount: 1,
        },
        select: { id: true },
      });
      blobId = newBlob.id;
    } catch (e: any) {
      // Handle race condition where blob was created
      // between writeFile and tx.blob.create
      if (e.code === 'P2002') {
        const blob = await tx.blob.update({
          where: { hash: chunkHash },
          data: { refCount: { increment: 1 } },
          select: { id: true },
        });
        blobId = blob.id;
      } else throw e;
    }

    const created = await tx.fileChunk.createMany({
      data: [{ size: chunkBuffer.length, fileId, blobId: blobId!, chunkIndex }],
      skipDuplicates: true,
    });

    if (created.count > 0) {
      await tx.uploadSession.update({
        where: { id: uploadId },
        data: { uploadedChunks: { increment: 1 } },
      });
    }
  });
}

export async function finishUpload(
  reqId: string,
  userId: string,
  uploadId: string,
) {
  const session = await validateUploadSession(uploadId, userId);

  if (session.uploadedChunks !== session.totalChunks) {
    throw new HttpError({
      status: 400,
      code: StorageErrorCode.UPLOAD_INCOMPLETE,
      message: 'Upload is yet to complete',
    });
  }

  const fileId = session.file?.id;
  if (!fileId) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Upload session is missing its file record',
    });
  }

  await prisma.uploadSession.update({
    where: { id: uploadId },
    data: { status: UploadStatus.completed },
  });

  await enqueueThumbnailJob(
    jobNames.thumbnailJobName,
    {
      userId,
      fileId,
      requestId: reqId,
    },
    fileId,
  );
}

export async function cancelUpload(
  userId: string,
  uploadId: string,
  requestId: string,
  idempotencyKey: string,
) {
  const session = await prisma.uploadSession.findFirst({
    where: { id: uploadId, userId },
    include: { file: { select: { id: true, userId: true } } },
  });

  if (!session) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'Upload session not found',
    });
  }

  if (
    session.status === UploadStatus.active &&
    session.expiresAt < new Date()
  ) {
    throw new HttpError({
      status: 410,
      code: StorageErrorCode.UPLOAD_EXPIRED,
      message: 'Upload session expired',
    });
  }

  if (
    session.status === UploadStatus.cancelled ||
    session.status === UploadStatus.expired
  ) {
    return;
  }

  if (session.status === UploadStatus.completed) {
    throw new HttpError({
      status: 400,
      code: CommonErrorCode.BAD_REQUEST,
      message: 'Cannot cancel a completed upload',
    });
  }

  if (!session.file) {
    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Upload session is missing its file record',
    });
  }

  await prisma.uploadSession.update({
    where: { id: session.id },
    data: { status: UploadStatus.cancelled },
  });

  await release(session.file.userId, session.totalSize);

  await enqueueUploadCleanupJob(
    jobNames.uploadCleanupJobName,
    {
      uploadId,
      requestId,
      userId,
    },
    idempotencyKey,
  );
}

export async function getUploadStatus(userId: string, uploadId: string) {
  const session = await prisma.uploadSession.findFirst({
    where: { id: uploadId, userId },
  });

  if (!session) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'Upload session not found',
    });
  }

  if (
    session.status === UploadStatus.active &&
    session.expiresAt < new Date()
  ) {
    throw new HttpError({
      status: 410,
      code: StorageErrorCode.UPLOAD_EXPIRED,
      message: 'Upload session expired',
    });
  }

  return {
    status: session.status,
    uploadedChunks: session.uploadedChunks,
    totalChunks: session.totalChunks,
  };
}

/**
 * Shared validator for ensuring sessions are active and owned by the user
 */
export async function validateUploadSession(sessionId: string, userId: string) {
  const uploadSession = await prisma.uploadSession.findFirst({
    where: { id: sessionId, userId, status: UploadStatus.active },
    include: { file: { select: { id: true, userId: true } } },
  });

  if (!uploadSession) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'Upload session not found',
    });
  }

  if (uploadSession.expiresAt < new Date()) {
    throw new HttpError({
      status: 410,
      code: StorageErrorCode.UPLOAD_EXPIRED,
      message: 'Upload session expired',
    });
  }

  return uploadSession;
}
