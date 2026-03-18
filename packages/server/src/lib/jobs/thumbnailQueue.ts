import { ConnectionOptions, Queue } from 'bullmq';
import { ThumbnailJobPayload, queueNames } from '@homelab/shared/jobs';
import { enqueueJob } from '../enqueueJob';
import { redis } from '@homelab/shared/redis';

export const thumbnailQueue = new Queue(queueNames.thumbnailQueueName, {
  connection: redis as unknown as ConnectionOptions,
});

const defaultThumbnailJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export const enqueueThumbnailJob = enqueueJob<ThumbnailJobPayload>(
  async (name: string, payload: ThumbnailJobPayload, jobId: string) => {
    await thumbnailQueue.add(name, payload, {
      ...defaultThumbnailJobOptions,
      jobId, // idempotencyKey used as BullMQ jobId
    });
  },
);
