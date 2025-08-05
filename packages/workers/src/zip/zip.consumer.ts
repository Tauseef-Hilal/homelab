import { Worker } from 'bullmq';
import redis from '@shared/redis';
import { queueNames } from '@shared/queues/queue.constants';
import { withRequestId } from '@shared/logging';
import { zipFolder } from './zip.processor';
import { ZipJobPayload, ZipJobResult } from '@shared/queues/zip/zip.types';
import { updateJob } from '../utils/db';
import { prisma } from '@shared/prisma';
import path from 'path';
import { zipConstants } from '../constants/zip.constants';
import { env } from '@shared/config/env';

export const zipWorker = new Worker<ZipJobPayload, ZipJobResult>(
  queueNames.zip,
  zipFolder,
  { connection: redis }
);

zipWorker.on('active', async (job, prev) => {
  const logger = withRequestId(job.data.requestId);
  await updateJob(job.data.prismaJobId, { status: 'processing', progress: 0 });

  logger.info(
    {
      userId: job.data.userId,
      folderId: job.data.folderId,
      folderPath: job.data.folderPath,
      attempts: job.attemptsMade,
    },
    `Processing job: ${job.name}<${job.id}>`
  );
});

zipWorker.on('completed', async (job, res) => {
  const logger = withRequestId(job.data.requestId);
  const link = await prisma.downloadLink.create({
    data: {
      fileName: path.basename(res.zipPath),
      userId: job.data.userId,
      requestId: job.data.requestId,
      expiresAt: new Date(Date.now() + zipConstants.DOWNLOAD_LINK_EXPIRY_MS),
    },
  });

  await updateJob(job.data.prismaJobId, {
    status: 'completed',
    progress: 100,
    attempts: job.attemptsMade,
    result: {
      downloadLink: `${env.API_BASE_URL}/api/storage/download/${link.id}`,
    },
  });

  logger.info(
    {
      userId: job.data.userId,
      folderId: job.data.folderId,
      folderPath: job.data.folderPath,
      attempts: job.attemptsMade,
    },
    `Job ${job.name}<${job.id}> completed`
  );
});

zipWorker.on('failed', async (job, err) => {
  const logger = withRequestId(job?.data.requestId ?? '');
  await updateJob(job?.data.prismaJobId ?? '', {
    status: 'failed',
    attempts: job?.attemptsMade ?? 0,
  });

  logger.error(
    {
      userId: job?.data.userId,
      folderId: job?.data.folderId,
      folderPath: job?.data.folderPath,
      attempts: job?.attemptsMade,
      error: err.message,
    },
    `Job ${job?.name}<${job?.id}> failed`
  );
});
