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

    //  Fetch userId and hasThumbnail alongside id and size
    const file = await prisma.file.findUnique({
      where: { uploadSessionId: uploadId },
      select: {
        id: true,
        size: true,
        userId: true,
        hasThumbnail: true,
      },
    });

    // Idempotent cleanup (job may retry)
    if (!file) {
      return { cleanedAt: new Date().toISOString() };
    }

    const deletedStorageKeys: string[] = [];

    await prisma.$transaction(async (tx) => {
      const updatedBlobs = await tx.$queryRaw<
        { id: string; refCount: number; blobKey: string }[]
      >`
        UPDATE "Blob"
        SET "refCount" = GREATEST("refCount" - counts.count, 0)
        FROM (
          SELECT "blobId", COUNT(*) as count
          FROM "FileChunk"
          WHERE "fileId" = ${file.id}
          GROUP BY "blobId"
        ) counts
        WHERE "Blob"."id" = counts."blobId"
        RETURNING "Blob"."id", "Blob"."refCount", "Blob"."blobKey"
      `;

      // Delete the file (FileChunks should cascade)
      await tx.file.delete({
        where: { id: file.id },
      });

      const orphanedBlobIds: string[] = [];

      updatedBlobs.forEach((b) => {
        if (b.refCount <= 0) {
          orphanedBlobIds.push(b.id);
          deletedStorageKeys.push(b.blobKey); // Add blob key to physical deletion list
        }
      });

      // Delete orphaned blobs from DB
      if (orphanedBlobIds.length > 0) {
        await tx.blob.deleteMany({
          where: { id: { in: orphanedBlobIds } },
        });
      }
    });

    //  Queue thumbnail for physical deletion if it exists
    const storage = getStorageProvider();
    if (file.hasThumbnail) {
      deletedStorageKeys.push(storage.keys.thumbnail(file.userId, file.id));
    }

    //  Delete all physical files from disk AFTER DB commit
    const blobKeys = deletedStorageKeys.filter((k) => k.startsWith('blobs'));
    const thumbKeys = deletedStorageKeys.filter((k) =>
      k.startsWith('thumbnails'),
    );

    try {
      await Promise.all([
        blobKeys.length > 0
          ? storage.blobs.deleteMany([...new Set(blobKeys)])
          : Promise.resolve(),
        thumbKeys.length > 0
          ? storage.artifacts.deleteMany([...new Set(thumbKeys)])
          : Promise.resolve(),
      ]);
    } catch (err) {
      logger.error(err, 'Failed to delete physical files after upload cleanup');
    }

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
