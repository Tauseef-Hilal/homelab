import {
  CommonErrorCode,
  HttpError,
  StorageErrorCode,
} from '@homelab/shared/errors';
import { jobNames } from '@homelab/shared/jobs';
import { prisma } from '@homelab/shared/prisma';
import { requestSchemas } from '@homelab/shared/schemas/storage';
import {
  getBlobStorageKeyByHash,
  getBlobStoragePathByKey,
  release,
  reserve,
  resolveFileName,
} from '@homelab/shared/utils';
import { UploadStatus, Visibility } from '@prisma/client';
import { enqueueThumbnailJob } from '@server/lib/jobs/thumbnailQueue';
import { randomUUID, createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import {
  MAX_CONCURRENT_UPLOADS,
  MAX_FILE_SIZE,
  UPLOAD_EXPIRY,
} from '../constants/limits';
import { enqueueUploadCleanupJob } from '@server/lib/jobs/fileIOQueue';

/**
 * Initializes a new upload session or returns existing one
 */
export async function initUpload(
  userId: string,
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
    where: { userId, status: UploadStatus.active },
    _count: {
      id: true,
    },
  });

  if (count._count.id > MAX_CONCURRENT_UPLOADS) {
    throw new HttpError({
      status: 429,
      code: CommonErrorCode.RATE_LIMITED,
      message: 'Too many uploads in progress. Try again later',
    });
  }

  try {
    const existingSession = await prisma.uploadSession.findUnique({
      where: { id: uploadId, userId },
      select: { file: { select: { id: true } } },
    });

    // Idempotency check: return existing session if present
    if (existingSession) return { fileId: existingSession.file?.id, uploadId };

    await reserve(userId, totalSize);

    const fileId = randomUUID();
    const { resolvedName, resolvedPath } = await resolveFileName({
      name,
      destFolderId: folderId,
    });

    await prisma.uploadSession.create({
      data: {
        id: uploadId,
        totalChunks,
        totalSize,
        uploadedChunks: 0,
        status: UploadStatus.active,
        expiresAt: new Date(Date.now() + UPLOAD_EXPIRY),
        userId,
        file: {
          create: {
            id: fileId,
            name: resolvedName,
            size: totalSize,
            fullPath: resolvedPath,
            visibility: Visibility.private,
            folderId,
            mimeType,
            userId,
          },
        },
      },
    });

    return { fileId, uploadId };
  } catch (err: any) {
    // Only release quota if the error wasn't already a quota/limit rejection
    const isLimitError = [
      StorageErrorCode.QUOTA_EXCEEDED,
      StorageErrorCode.SERVER_LIMIT_EXCEEDED,
    ].includes(err.code);
    if (err.code && !isLimitError) {
      await release(userId, totalSize);
    }

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

  const chunkHashes = [...new Set(chunks.map((c) => c.hash))];
  const existingBlobs = await prisma.blob.findMany({
    where: { hash: { in: chunkHashes } },
    select: { id: true, hash: true },
  });

  if (existingBlobs.length === 0) {
    return { missingChunks: chunks.map((c) => c.index) };
  }

  const blobByHash = new Map(existingBlobs.map((b) => [b.hash, b]));
  const blobRefIncrements = new Map<string, number>();

  const fileChunks = chunks
    .filter((chunk) => blobByHash.has(chunk.hash))
    .map((chunk) => {
      const blob = blobByHash.get(chunk.hash)!;
      blobRefIncrements.set(blob.id, (blobRefIncrements.get(blob.id) ?? 0) + 1);
      return {
        fileId,
        blobId: blob.id,
        chunkIndex: chunk.index,
        size: chunk.size,
      };
    });

  const missingChunks = chunks
    .filter((c) => !blobByHash.has(c.hash))
    .map((c) => c.index);

  // Link existing blobs to the new file in a single transaction
  await prisma.$transaction(async (tx) => {
    if (fileChunks.length === 0) return;

    const created = await tx.fileChunk.createMany({
      data: fileChunks,
      skipDuplicates: true,
    });

    if (created.count === 0) return;

    await tx.uploadSession.update({
      where: { id: uploadId },
      data: { uploadedChunks: { increment: created.count } },
    });

    await Promise.all(
      [...blobRefIncrements.entries()].map(([blobId, count]) =>
        tx.blob.update({
          where: { id: blobId },
          data: { refCount: { increment: count } },
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

  const storagePath = getBlobStoragePathByKey(
    getBlobStorageKeyByHash(chunkHash),
  );

  try {
    await mkdir(path.dirname(storagePath), { recursive: true });
    // 'wx' flag ensures we don't overwrite if another
    // concurrent request beat us to it
    await writeFile(storagePath, chunkBuffer, { flag: 'wx' });
  } catch (e: any) {
    if (e.code === 'EEXIST') {
      // This is what 'wx' throws if the file is already there
    } else {
      throw e;
    }
  }

  await prisma.$transaction(async (tx) => {
    let blobId: string;

    try {
      const newBlob = await tx.blob.create({
        data: {
          hash: chunkHash,
          storageKey: storagePath,
          size: chunkBuffer.length,
          refCount: 1,
        },
        select: { id: true },
      });
      blobId = newBlob.id;
    } catch (e: any) {
      // Handle race condition where blob was created between writeFile and tx.blob.create
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
      status: 500,
      code: StorageErrorCode.UPLOAD_INCOMPLETE,
      message: 'Upload is yet to complete',
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
      fileId: session.file?.id ?? '',
      requestId: reqId,
    },
    session.file?.id ?? '',
  );
}

export async function cancelUpload(
  userId: string,
  uploadId: string,
  requestId: string,
  idempotencyKey: string,
) {
  const session = await validateUploadSession(uploadId, userId);

  if (session.status === UploadStatus.cancelled) return;

  await prisma.uploadSession.update({
    where: { id: session.id },
    data: { status: UploadStatus.cancelled },
  });

  await release(userId, session.totalSize);

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
  const session = await validateUploadSession(uploadId, userId);

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
    include: { file: { select: { id: true } } },
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
