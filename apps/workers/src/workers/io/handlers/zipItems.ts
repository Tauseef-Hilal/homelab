import archiver from 'archiver';
import { ZipJobPayload, ZipJobResult } from '@homelab/contracts/jobs';
import { prisma } from '@homelab/db/prisma';
import { zipConstants } from '@workers/constants/zip.constants';
import { env, getStorageProvider } from '@homelab/infra/config';
import { CommonErrorCode, HttpError } from '@homelab/contracts/errors';
import pLimit from 'p-limit';
import { Job } from 'bullmq';
import { getJobLogger } from '@workers/utils/logger';
import { PassThrough } from 'stream';
import { assertBulkPermission } from '@homelab/storage';
import { FilePermission } from '@homelab/storage/constants';

const BATCH_SIZE = 1000;

type PartialFileWithChunks = {
  id: string;
  fullPath: string;
  chunks: {
    size: number;
    blob: {
      blobKey: string;
    };
  }[];
};

export const zipItems = async (
  job: Job<ZipJobPayload>,
): Promise<ZipJobResult> => {
  const storage = getStorageProvider();
  const logger = getJobLogger('io-worker', job);
  const { userId, shareToken, items, requestId } = job.data;

  const existingLink = await prisma.downloadLink.findFirst({
    where: { userId, requestId },
    orderBy: { createdAt: 'desc' },
  });

  if (existingLink) {
    await writeJobResult(job.id ?? '', existingLink.id);
    return {
      zippedAt: new Date().toISOString(),
      zipPath: existingLink.artifactKey,
    };
  }

  const zipName = buildZipName(userId, requestId);
  const zipKey = storage.keys.downloadPackage(zipName);
  const { archive, uploadPromise } = createArchive(zipKey, storage);

  try {
    const fileIds = items.filter((i) => i.type === 'file').map((i) => i.id);
    const folderIds = items.filter((i) => i.type === 'folder').map((i) => i.id);

    // ---  Permissions Check ---
    const [sourceFiles, sourceFolders] = await Promise.all([
      fileIds.length > 0
        ? prisma.file.findMany({
            where: { id: { in: fileIds } },
            select: { id: true, userId: true, fullPath: true },
          })
        : Promise.resolve([]),
      folderIds.length > 0
        ? prisma.folder.findMany({
            where: { id: { in: folderIds } },
            select: { id: true, userId: true, fullPath: true },
          })
        : Promise.resolve([]),
    ]);

    const sourceItemsToCheck = [
      ...sourceFiles.map((f) => ({ ...f, type: 'file' as const })),
      ...sourceFolders.map((f) => ({ ...f, type: 'folder' as const })),
    ];

    // Sanity check
    if (sourceItemsToCheck.length !== items.length) {
      throw new HttpError({
        status: 404,
        code: CommonErrorCode.NOT_FOUND,
        message: 'One or more source items do not exist',
      });
    }

    // Require READ access to zip the requested items
    await assertBulkPermission(
      sourceItemsToCheck,
      { userId, token: shareToken },
      FilePermission.READ,
    );

    // ---  Execute Zip ---
    const folderPrefixes = sourceFolders.map((f) => ({
      fullPath: { startsWith: `${f.fullPath}/` },
    }));

    const hasFiles = await appendFilesToArchive(
      archive,
      fileIds,
      folderPrefixes,
    );

    if (!hasFiles) {
      // Ensure archive isn't empty
      archive.append('No files found', { name: 'empty.txt' });
    }

    await archive.finalize();
    await uploadPromise;

    await finalizeJob(job.id ?? '', userId, requestId, zipName);

    return { zippedAt: new Date().toISOString(), zipPath: zipKey };
  } catch (err) {
    archive.abort();
    await storage.artifacts.deleteIfPresent(zipKey).catch(() => {});

    if (err instanceof HttpError) throw err;

    logger.error('Zip Job Error:', err);

    throw new HttpError({
      status: 500,
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to zip files',
    });
  }
};

function createArchive(
  zipKey: string,
  storage: ReturnType<typeof getStorageProvider>,
) {
  const archive = archiver('zip', { zlib: { level: 5 } });

  const passThrough = new PassThrough({
    highWaterMark: 1024 * 1024 * 4,
  });

  const uploadPromise = storage.artifacts.put(zipKey, passThrough);

  archive.on('error', (err) => {
    passThrough.destroy(err);
  });

  archive.pipe(passThrough);

  return { archive, uploadPromise };
}

async function appendFilesToArchive(
  archive: archiver.Archiver,
  fileIds: string[],
  folderPrefixes: any[],
) {
  const storage = getStorageProvider();

  let cursor: string | null = null;
  let hasFiles = false;
  const limit = pLimit(4); // prevent too many parallel streams

  // Build OR conditions dynamically to prevent Prisma errors on empty arrays
  const orConditions: any[] = [];
  if (fileIds.length > 0) orConditions.push({ id: { in: fileIds } });
  if (folderPrefixes.length > 0) orConditions.push(...folderPrefixes);

  if (orConditions.length === 0) return false;

  do {
    const batchFiles: PartialFileWithChunks[] = await prisma.file.findMany({
      where: {
        OR: orConditions,
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE + 1,
      select: {
        id: true,
        fullPath: true,
        chunks: {
          orderBy: { chunkIndex: 'asc' },
          select: { size: true, blob: { select: { blobKey: true } } },
        },
      },
    });

    const hasMore = batchFiles.length > BATCH_SIZE;

    // remove extra record used only for pagination detection
    if (hasMore) batchFiles.pop();
    if (batchFiles.length > 0) hasFiles = true;

    await Promise.all(
      batchFiles.map((file) =>
        limit(async () => {
          const chunks = file.chunks.map((chunk) => ({
            blobKey: chunk.blob.blobKey,
            size: chunk.size,
          }));

          const stream = storage.reader.openFile(chunks);

          // append file stream to zip
          archive.append(stream, {
            name: file.fullPath.replace(/^\//, ''),
          });

          // wait for stream completion before processing next file
          await new Promise((resolve, reject) => {
            stream.on('end', resolve);
            stream.on('error', reject);
          });
        }),
      ),
    );

    cursor = hasMore ? batchFiles[batchFiles.length - 1].id : null;
  } while (cursor);

  return hasFiles;
}

async function finalizeJob(
  prismaJobId: string,
  userId: string,
  requestId: string,
  zipName: string,
) {
  await prisma.$transaction(async (tx) => {
    const artifactKey = getStorageProvider().keys.downloadPackage(zipName);
    const expiresAt = new Date(
      Date.now() + zipConstants.DOWNLOAD_LINK_EXPIRY_MS,
    );

    const existingLink = await tx.downloadLink.findFirst({
      where: { userId, requestId },
      orderBy: { createdAt: 'desc' },
    });

    const link = existingLink
      ? await tx.downloadLink.update({
          where: { id: existingLink.id },
          data: { displayName: zipName, artifactKey, expiresAt },
        })
      : await tx.downloadLink.create({
          data: {
            userId,
            requestId,
            displayName: zipName,
            artifactKey,
            expiresAt,
          },
        });

    if (prismaJobId) {
      await tx.job.update({
        where: { id: prismaJobId },
        data: {
          result: {
            downloadLink: `${env.API_BASE_URL}/storage/download/${link.id}`,
          },
        },
      });
    }
  });
}

function buildZipName(userId: string, requestId: string) {
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const sanitizedRequestId = requestId.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${sanitizedUserId}-${sanitizedRequestId}.zip`;
}

async function writeJobResult(prismaJobId: string, linkId: string) {
  if (!prismaJobId) return;
  await prisma.job.update({
    where: { id: prismaJobId },
    data: {
      result: {
        downloadLink: `${env.API_BASE_URL}/storage/download/${linkId}`,
      },
    },
  });
}
