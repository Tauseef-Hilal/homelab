import { randomUUID } from 'crypto';
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
  const { userId, items, requestId } = job.data;

  const zipName = `${randomUUID()}.zip`;
  const zipKey = storage.keys.downloadPackage(zipName);

  const { archive, uploadPromise } = createArchive(zipKey, storage);

  try {
    const fileIds = items.filter((i) => i.type !== 'folder').map((i) => i.id);
    const folderIds = items.filter((i) => i.type === 'folder').map((i) => i.id);

    const folderPrefixes = await getFolderPrefixes(folderIds, userId);

    const hasFiles = await appendFilesToArchive(
      archive,
      userId,
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

// Updated helper function
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

async function getFolderPrefixes(folderIds: string[], userId: string) {
  const folders = await prisma.folder.findMany({
    where: { id: { in: folderIds }, userId },
    select: { fullPath: true },
  });

  return folders.map((f) => ({
    fullPath: { startsWith: `${f.fullPath}/` },
  }));
}

async function appendFilesToArchive(
  archive: archiver.Archiver,
  userId: string,
  fileIds: string[],
  folderPrefixes: any[],
) {
  const storage = getStorageProvider();

  let cursor: string | null = null;
  let hasFiles = false;
  const limit = pLimit(4); // prevent too many parallel streams

  do {
    const batchFiles: PartialFileWithChunks[] = await prisma.file.findMany({
      where: {
        userId,
        OR: [{ id: { in: fileIds } }, ...folderPrefixes],
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
            name: file.fullPath.replace(/^\//, ''), // remove leading slash for zip path
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
    const link = await tx.downloadLink.create({
      data: {
        userId,
        requestId,
        displayName: zipName,
        artifactKey: getStorageProvider().keys.downloadPackage(zipName),
        expiresAt: new Date(Date.now() + zipConstants.DOWNLOAD_LINK_EXPIRY_MS),
      },
    });

    await tx.job.update({
      where: { id: prismaJobId },
      data: {
        result: {
          downloadLink: `${env.API_BASE_URL}/storage/download/${link.id}`,
        },
      },
    });
  });
}
