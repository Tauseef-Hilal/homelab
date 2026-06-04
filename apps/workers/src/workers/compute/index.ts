import { ConnectionOptions, Worker } from 'bullmq';
import {
  GenerateThumbnailJobPayload,
  GenerateThumbnailJobResult,
  queueNames,
} from '@homelab/contracts/jobs';
import { prisma } from '@homelab/db/prisma';
import { logger } from '@homelab/infra/logging';
import { redis } from '@homelab/infra/redis';
import { initializeStorageRuntime } from '@homelab/storage';
import { updateJob } from '../../utils/db';
import { getJobLogger } from '@workers/utils/logger';
import { computeProcessor } from './processor';

async function startComputeWorker() {
  await initializeStorageRuntime();

  const computeWorker = new Worker<GenerateThumbnailJobPayload, GenerateThumbnailJobResult>(
    queueNames.computeQueueName,
    computeProcessor,
    {
      connection: redis as unknown as ConnectionOptions,
      concurrency: 2,
    },
  );

  computeWorker.on('active', async (job) => {
    await updateJob(job.id ?? '', { status: 'processing' });

    const logger = getJobLogger('compute-worker', job);
    logger.info(
      {
        userId: job.data.userId,
        attempts: job.attemptsMade,
      },
      `Processing job: ${job.name}<${job.id}>`,
    );
  });

  computeWorker.on('completed', async (job) => {
    await updateJob(job.id ?? '', {
      status: 'completed',
      attempts: job.attemptsMade,
    });

    await prisma.file.update({
      where: { id: job.data.fileId },
      data: { hasThumbnail: true },
    });

    const logger = getJobLogger('compute-worker', job);
    logger.info(
      {
        userId: job.data.userId,
        attempts: job.attemptsMade,
      },
      `Job ${job.name}<${job.id}> completed`,
    );
  });

  computeWorker.on('failed', async (job, err) => {
    await updateJob(job?.id ?? '', {
      status: 'failed',
      error: err.message,
      attempts: job?.attemptsMade ?? 0,
    });

    const logger = getJobLogger('compute-worker', job);
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

startComputeWorker().catch((error) => {
  logger.error({ err: error }, 'Failed to start compute worker');
  process.exit(1);
});
