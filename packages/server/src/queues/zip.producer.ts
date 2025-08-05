import { Queue } from 'bullmq';
import { queueNames } from '@shared/queues/queue.constants';
import { zipJob } from '@shared/queues/zip/zip.constants';
import { ZipJobPayload } from '@shared/queues/zip/zip.types';
import redis from '@shared/redis';
import { enqueueJob } from '@server/lib/enqueueJob';

export const zipQueue = new Queue<ZipJobPayload>(queueNames.zip, {
  connection: redis,
});

export const enqueueZipJob = enqueueJob<ZipJobPayload>(
  async (requestId, data) => {
    await zipQueue.add(zipJob.name, data, {
      attempts: zipJob.attempts,
      backoff: zipJob.backoff,
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
);
