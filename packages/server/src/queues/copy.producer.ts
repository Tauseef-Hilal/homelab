import { Queue } from 'bullmq';
import { queueNames } from '@shared/queues/queue.constants';
import { copyJob } from '@shared/queues/copy/copy.constants';
import { CopyJobPayload } from '@shared/queues/copy/copy.types';
import redis from '@shared/redis';
import { enqueueJob } from '@server/lib/enqueueJob';

export const copyQueue = new Queue<CopyJobPayload>(queueNames.copy, {
  connection: redis,
});

export const enqueueCopyJob = enqueueJob<CopyJobPayload>(
  async (requestId, data) => {
    await copyQueue.add(copyJob.name, data, {
      attempts: copyJob.attempts,
      backoff: copyJob.backoff,
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
);
