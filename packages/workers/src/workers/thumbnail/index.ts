import { ConnectionOptions, Worker } from 'bullmq';
import { thumbnailProcessor } from './processor';
import { redis } from '@homelab/shared/redis';
import { prisma } from '@homelab/shared/prisma';
import { updateJob } from '../../utils/db';
import { ThumbnailJobPayload, ThumbnailJobResult } from '@homelab/shared/jobs';
import { queueNames } from '@homelab/shared/jobs';
import { getJobLogger } from '@workers/utils/logger';

export const thumbnailWorker = new Worker<
  ThumbnailJobPayload,
  ThumbnailJobResult
>(queueNames.thumbnailQueueName, thumbnailProcessor, {
  connection: redis as unknown as ConnectionOptions,
  concurrency: 1,
});

thumbnailWorker.on('active', async (job, prev) => {
  await updateJob(job.data.prismaJobId, { status: 'processing' });

  const logger = getJobLogger('thumbnail-worker', job);
  logger.info(
    {
      userId: job.data.userId,
      filePath: job.data.filePath,
      attempts: job.attemptsMade,
    },
    `Processing job: ${job.name}<${job.id}>`,
  );
});

thumbnailWorker.on('completed', async (job) => {
  await updateJob(job.data.prismaJobId, {
    status: 'completed',
    attempts: job.attemptsMade,
  });

  await prisma.file.update({
    where: { id: job.data.fileId },
    data: { hasThumbnail: true },
  });

  const logger = getJobLogger('thumbnail-worker', job);
  logger.info(
    {
      userId: job.data.userId,
      filePath: job.data.filePath,
      attempts: job.attemptsMade,
    },
    `Job ${job.name}<${job.id}> completed`,
  );
});

thumbnailWorker.on('failed', async (job, err) => {
  await updateJob(job?.data.prismaJobId ?? '', {
    status: 'failed',
    attempts: job?.attemptsMade ?? 0,
  });

  const logger = getJobLogger('thumbnail-worker', job);
  logger.error(
    {
      userId: job?.data.userId,
      filePath: job?.data.filePath,
      attempts: job?.attemptsMade,
      error: err.message,
    },
    `Job ${job?.name}<${job?.id}> failed`,
  );
});
