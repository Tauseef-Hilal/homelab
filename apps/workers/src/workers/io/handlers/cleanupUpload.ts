import fs from 'fs/promises';
import {
  UploadCleanupJobPayload,
  UploadCleanupJobResult,
} from '@homelab/contracts/jobs';
import { prisma } from '@homelab/db/prisma';
import { CommonErrorCode, HttpError } from '@homelab/contracts/errors';
import { Job } from 'bullmq';
import { getJobLogger } from '@workers/utils/logger';
import { getStorageProvider } from '@homelab/infra';

export const cleanupUpload = async (
  job: Job<UploadCleanupJobPayload>,
): Promise<UploadCleanupJobResult> => {
  try {
    const { uploadId } = job.data;
    const logger = getJobLogger('io-worker', job);

    const file = await prisma.file.findUnique({
      where: { uploadSessionId: uploadId },
      select: {
        id: true,
        size: true,
      },
    });

    // Idempotent cleanup (job may retry)
    if (!file) {
      return { cleanedAt: new Date().toISOString() };
    }

    const deletedBlobKeys: string[] = [];

    await prisma.$transaction(async (tx) => {
      // Aggregate blob usage for this file
      const blobUsage = await tx.fileChunk.groupBy({
        by: ['blobId'],
        where: { fileId: file.id },
        _count: { blobId: true },
      });

      if (blobUsage.length === 0) {
        await tx.file.delete({ where: { id: file.id } });
        return;
      }

      // Decrement blob reference counts
      await Promise.all(
        blobUsage.map(({ blobId, _count }) =>
          tx.blob.update({
            where: { id: blobId },
            data: {
              refCount: { decrement: _count.blobId },
            },
          }),
        ),
      );

      // Delete the file
      // fileChunk rows should cascade via schema
      await tx.file.delete({
        where: { id: file.id },
      });

      // Find blobs that are no longer referenced
      const deletableBlobs = await tx.blob.findMany({
        where: {
          id: { in: blobUsage.map((b) => b.blobId) },
          refCount: { lte: 0 },
        },
        select: {
          id: true,
          blobKey: true,
        },
      });

      // Delete orphaned blobs from DB
      if (deletableBlobs.length > 0) {
        await tx.blob.deleteMany({
          where: {
            id: { in: deletableBlobs.map((b) => b.id) },
          },
        });

        deletedBlobKeys.push(...deletableBlobs.map((b) => b.blobKey));
      }
    });

    // Delete files from disk AFTER DB commit
    const storage = getStorageProvider();
    await storage.blobs.deleteMany(deletedBlobKeys);

    return { cleanedAt: new Date().toISOString() };
  } catch (err: unknown) {
    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to cleanup upload session',
        });
  }
};
