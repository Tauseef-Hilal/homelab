import { Queue } from 'bullmq';
import { JobPayload, ThumbnailJobPayload } from '@shared/jobs/payload.types';
import { queueNames } from '@shared/jobs/constants';
import { enqueueJob } from '../enqueueJob';
import redis from '@shared/redis';

export const thumbnailQueue = new Queue(queueNames.thumbnailQueueName, {
  connection: redis,
});

export const enqueueThumbnailJob = enqueueJob<ThumbnailJobPayload>(
  async (name: string, payload: JobPayload) => {
    await thumbnailQueue.add(name, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
);
