import { ConnectionOptions, Worker } from 'bullmq';
import { redis } from '@homelab/shared/redis';
import { queueNames, JobPayload } from '@homelab/shared/jobs';
import { fileIOJobProcessor } from './processor';
import { updateJob } from '../../utils/db';
import { getJobLogger } from '@workers/utils/logger';

export const fileIOWorker = new Worker<JobPayload>(
  queueNames.fileIOQueueName,
  fileIOJobProcessor,
  { connection: redis as unknown as ConnectionOptions, concurrency: 10 },
);

fileIOWorker.on('active', async (job, prev) => {
  await updateJob(job.data.prismaJobId, { status: 'processing' });

  const logger = getJobLogger('io-worker', job);
  logger.info(`Processing job: ${job.name}<${job.id}>`);
});

fileIOWorker.on('completed', async (job) => {
  await updateJob(job.data.prismaJobId, {
    status: 'completed',
    attempts: job.attemptsMade,
  });

  const logger = getJobLogger('io-worker', job);
  logger.info(`Job ${job.name}<${job.id}> completed`);
});

fileIOWorker.on('failed', async (job, err) => {
  await updateJob(job?.data.prismaJobId ?? '', {
    status: 'failed',
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
