import { Worker } from 'bullmq';
import redis from '@shared/redis';
import { queueNames } from '@shared/queues/queue.constants';
import { withRequestId } from '@shared/logging';
import { copyFolder } from './copy.processor';
import { CopyJobPayload, CopyJobResult } from '@shared/queues/copy/copy.types';
import { updateJob } from '../../utils/db';

export const copyWorker = new Worker<CopyJobPayload, CopyJobResult>(
  queueNames.copy,
  copyFolder,
  { connection: redis }
);

copyWorker.on('active', async (job, prev) => {
  const logger = withRequestId(job.data.requestId);
  await updateJob(job.data.prismaJobId, { status: 'processing', progress: 0 });

  logger.info(
    {
      userId: job.data.userId,
      src: job.data.srcPath,
      dest: job.data.destPath,
      attempts: job.attemptsMade,
    },
    `Processing job: ${job.name}<${job.id}>`
  );
});

copyWorker.on('completed', async (job) => {
  const logger = withRequestId(job.data.requestId);
  await updateJob(job.data.prismaJobId, {
    status: 'completed',
    progress: 100,
    attempts: job.attemptsMade,
  });

  logger.info(
    {
      userId: job.data.userId,
      src: job.data.srcPath,
      dest: job.data.destPath,
      attempts: job.attemptsMade,
    },
    `Job ${job.name}<${job.id}> completed`
  );
});

copyWorker.on('failed', async (job, err) => {
  const logger = withRequestId(job?.data.requestId ?? '');
  await updateJob(job?.data.prismaJobId ?? '', {
    status: 'failed',
    attempts: job?.attemptsMade ?? 0,
  });

  logger.error(
    {
      userId: job?.data.userId,
      src: job?.data.srcPath,
      dest: job?.data.destPath,
      attempts: job?.attemptsMade,
      error: err.message,
    },
    `Job ${job?.name}<${job?.id}> failed`
  );
});
