import { Worker } from 'bullmq';
import { queueNames } from '@shared/queues/queue.constants';
import { generateThumbnail } from './processor';
import {
  ThumbnailJobPayload,
  ThumbnailJobResult,
} from '@shared/queues/thumbnail//thumbnail.types';
import redis from '@shared/redis';
import { withRequestId } from '@shared/logging';
import { prisma } from '@shared/prisma';

const worker = new Worker<ThumbnailJobPayload, ThumbnailJobResult>(
  queueNames.thumbnail,
  generateThumbnail,
  { connection: redis }
);

worker.on('active', (job, prev) => {
  const logger = withRequestId(job.data.requestId);
  logger.info(
    {
      userId: job.data.userId,
      filePath: job.data.filePath,
      attempts: job.attemptsMade,
    },
    `Processing job: ${job.name}<${job.id}>`
  );
});

worker.on('completed', async (job) => {
  await prisma.file.update({
    where: { id: job.data.fileId },
    data: { hasThumbnail: true },
  });

  const logger = withRequestId(job.data.requestId);
  logger.info(
    {
      userId: job.data.userId,
      filePath: job.data.filePath,
      attempts: job.attemptsMade,
    },
    `Job ${job.name}<${job.id}> completed`
  );
});

worker.on('failed', (job, err) => {
  const logger = withRequestId(job?.data.requestId ?? '');
  logger.error(
    {
      userId: job?.data.userId,
      filePath: job?.data.filePath,
      attempts: job?.attemptsMade,
      error: err.message,
    },
    `Job ${job?.name}<${job?.id}> failed`
  );
});
