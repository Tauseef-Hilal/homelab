import { Queue, ConnectionOptions } from 'bullmq';
import {
  CopyJobPayload,
  DeleteJobPayload,
  JobPayload,
  MoveJobPayload,
  UploadCleanupJobPayload,
  ZipJobPayload,
  queueNames,
} from '@homelab/shared/jobs';
import { enqueueJob } from '../enqueueJob';
import { redis } from '@homelab/shared/redis';

export const fileIOQueue = new Queue(queueNames.fileIOQueueName, {
  connection: redis as unknown as ConnectionOptions,
});

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: true,
};

function createQueueEnqueue<T extends JobPayload>() {
  return enqueueJob<T>(async (name, payload, jobId) => {
    await fileIOQueue.add(name, payload, {
      ...defaultJobOptions,
      jobId, // idempotency key used as BullMQ jobId
    });
  });
}

export const enqueueCopyJob = createQueueEnqueue<CopyJobPayload>();
export const enqueueMoveJob = createQueueEnqueue<MoveJobPayload>();
export const enqueueDeleteJob = createQueueEnqueue<DeleteJobPayload>();
export const enqueueZipJob = createQueueEnqueue<ZipJobPayload>();
export const enqueueUploadCleanupJob =
  createQueueEnqueue<UploadCleanupJobPayload>();
