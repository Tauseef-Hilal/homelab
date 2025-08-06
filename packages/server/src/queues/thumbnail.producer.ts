import { Queue } from 'bullmq';
import { queueNames } from '@shared/queues/queue.constants';
import { thumbnailJob } from '@shared/queues/thumbnail/thumbnail.constants';
import { ThumbnailJobPayload } from '@shared/queues/thumbnail/thumbnail.types';
import redis from '@shared/redis';
import { enqueueJob } from '@server/lib/enqueueJob';

export const thumbnailQueue = new Queue<ThumbnailJobPayload>(
  queueNames.thumbnail,
  { connection: redis }
);

export const enqueueThumbnailJob = enqueueJob<ThumbnailJobPayload>(
  async (data) => {
    await thumbnailQueue.add(thumbnailJob.name, data, {
      attempts: thumbnailJob.attempts,
      backoff: thumbnailJob.backoff,
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
);
