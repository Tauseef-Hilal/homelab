import { ConnectionOptions, Worker } from 'bullmq';
import { ThumbnailJobPayload, ThumbnailJobResult, queueNames } from '@homelab/contracts/jobs';
import { prisma } from '@homelab/db/prisma';
import { logger } from '@homelab/infra/logging';
import { redis } from '@homelab/infra/redis';
import { initializeStorageRuntime } from '@homelab/storage';
import { updateJob } from '../../utils/db';
import { getJobLogger } from '@workers/utils/logger';
import { thumbnailProcessor } from './processor';

async function startThumbnailWorker() {
  await initializeStorageRuntime();

  const thumbnailWorker = new Worker<
    ThumbnailJobPayload,
    ThumbnailJobResult
  >(queueNames.thumbnailQueueName, thumbnailProcessor, {
    connection: redis as unknown as ConnectionOptions,
    concurrency: 2,
  });

  thumbnailWorker.on('active', async (job) => {
    await updateJob(job.id ?? '', { status: 'processing' });

    const logger = getJobLogger('thumbnail-worker', job);
    logger.info(
      {
        userId: job.data.userId,
        attempts: job.attemptsMade,
      },
      `Processing job: ${job.name}<${job.id}>`,
    );
  });

  thumbnailWorker.on('completed', async (job) => {
    await updateJob(job.id ?? '', {
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
        attempts: job.attemptsMade,
      },
      `Job ${job.name}<${job.id}> completed`,
    );
  });

  thumbnailWorker.on('failed', async (job, err) => {
    await updateJob(job?.id ?? '', {
      status: 'failed',
      error: err.message,
      attempts: job?.attemptsMade ?? 0,
    });

    const logger = getJobLogger('thumbnail-worker', job);
    logger.error(
      {
        userId: job?.data.userId,
        attempts: job?.attemptsMade,
        error: err.message,
      },
      `Job ${job?.name}<${job?.id}> failed`,
    );
  });
}

startThumbnailWorker().catch((error) => {
  logger.error({ err: error }, 'Failed to start thumbnail worker');
  process.exit(1);
});
