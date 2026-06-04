import { ConnectionOptions, Queue } from 'bullmq';
import { GenerateThumbnailJobPayload, queueNames } from '@homelab/contracts/jobs';
import { enqueueJob } from '../enqueueJob';
import { redis } from '@homelab/infra/redis';

export const computeQueue = new Queue(queueNames.computeQueueName, {
  connection: redis as unknown as ConnectionOptions,
});

const defaultComputeJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export const enqueueComputeJob = enqueueJob<GenerateThumbnailJobPayload>(
  async (name: string, payload: GenerateThumbnailJobPayload, jobId: string) => {
    await computeQueue.add(name, payload, {
      ...defaultComputeJobOptions,
      jobId, // idempotencyKey used as BullMQ jobId
    });
  },
);
