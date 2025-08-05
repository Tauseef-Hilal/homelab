import { Worker } from 'bullmq';
import { queueNames } from '@shared/queues/queue.constants';
import { generateThumbnail } from './thumbnail.processor';
import {
  ThumbnailJobPayload,
  ThumbnailJobResult,
} from '@shared/queues/thumbnail//thumbnail.types';
import redis from '@shared/redis';
import { withRequestId } from '@shared/logging';
import { prisma } from '@shared/prisma';
import { updateJob } from '../../utils/db';

export const thumbnailWorker = new Worker<
  ThumbnailJobPayload,
  ThumbnailJobResult
>(queueNames.thumbnail, generateThumbnail, { connection: redis });

thumbnailWorker.on('active', async (job, prev) => {
  const logger = withRequestId(job.data.requestId);
  await updateJob(job.data.prismaJobId, { status: 'processing', progress: 0 });

  logger.info(
    {
      userId: job.data.userId,
      filePath: job.data.filePath,
      attempts: job.attemptsMade,
    },
    `Processing job: ${job.name}<${job.id}>`
  );
});

thumbnailWorker.on('completed', async (job) => {
  const logger = withRequestId(job.data.requestId);

  await updateJob(job.data.prismaJobId, {
    status: 'completed',
    progress: 100,
    attempts: job.attemptsMade,
  });
  await prisma.file.update({
    where: { id: job.data.fileId },
    data: { hasThumbnail: true },
  });

  logger.info(
    {
      userId: job.data.userId,
      filePath: job.data.filePath,
      attempts: job.attemptsMade,
    },
    `Job ${job.name}<${job.id}> completed`
  );
});

thumbnailWorker.on('failed', async (job, err) => {
  const logger = withRequestId(job?.data.requestId ?? '');
  await updateJob(job?.data.prismaJobId ?? '', {
    status: 'failed',
    attempts: job?.attemptsMade ?? 0,
  });

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
