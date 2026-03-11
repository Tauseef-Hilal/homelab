import { ConnectionOptions, Queue } from 'bullmq';
import {
  JobPayload,
  ThumbnailJobPayload,
  queueNames,
} from '@homelab/shared/jobs';
import { enqueueJob } from '../enqueueJob';
import { redis } from '@homelab/shared/redis';

export const thumbnailQueue = new Queue(queueNames.thumbnailQueueName, {
  connection: redis as unknown as ConnectionOptions,
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
  },
);
