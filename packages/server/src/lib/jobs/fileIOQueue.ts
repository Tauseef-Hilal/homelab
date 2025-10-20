import { Queue } from 'bullmq';
import {
  CopyJobPayload,
  JobPayload,
  ZipJobPayload,
} from '@shared/jobs/payload.types';
import { queueNames } from '@shared/jobs/constants';
import { enqueueJob } from '../enqueueJob';
import redis from '@shared/redis';

export const fileIOQueue = new Queue(queueNames.fileIOQueueName, {
  connection: redis,
});

export const enqueueCopyJob = enqueueJob<CopyJobPayload>(
  async (name: string, payload: JobPayload) => {
    await fileIOQueue.add(name, payload, {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
);

export const enqueueZipJob = enqueueJob<ZipJobPayload>(
  async (name: string, payload: JobPayload) => {
    await fileIOQueue.add(name, payload, {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
);
