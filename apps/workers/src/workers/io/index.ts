import { ConnectionOptions, Worker } from 'bullmq';
import { JobPayload, queueNames } from '@homelab/contracts/jobs';
import { logger } from '@homelab/infra/logging';
import { redis } from '@homelab/infra/redis';
import { initializeStorageRuntime } from '@homelab/storage';
import { updateJob } from '../../utils/db';
import { getJobLogger } from '@workers/utils/logger';
import { fileIOJobProcessor } from './processor';

async function startFileIOWorker() {
  await initializeStorageRuntime();

  const fileIOWorker = new Worker<JobPayload>(
    queueNames.fileIOQueueName,
    fileIOJobProcessor,
    { connection: redis as unknown as ConnectionOptions, concurrency: 10 },
  );

  fileIOWorker.on('active', async (job) => {
    await updateJob(job.id ?? '', { status: 'processing' });

    const logger = getJobLogger('io-worker', job);
    logger.info(`Processing job: ${job.name}<${job.id}>`);
  });

  fileIOWorker.on('completed', async (job) => {
    await updateJob(job.id ?? '', {
      status: 'completed',
      attempts: job.attemptsMade,
    });

    const logger = getJobLogger('io-worker', job);
    logger.info(`Job ${job.name}<${job.id}> completed`);
  });

  fileIOWorker.on('failed', async (job, err) => {
    await updateJob(job?.id ?? '', {
      status: 'failed',
      error: err.message,
      attempts: job?.attemptsMade ?? 0,
    });

    const logger = getJobLogger('io-worker', job);
    logger.error(
      {
        error: err.message,
      },
      `Job ${job?.name}<${job?.id}> failed`,
    );
  });
}

startFileIOWorker().catch((error) => {
  logger.error({ err: error }, 'Failed to start IO worker');
  process.exit(1);
});
