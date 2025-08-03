import { Queue } from 'bullmq';
import { queueNames, thumbnailJob } from '@shared/queues/queue.constants';
import { ThumbnailJobPayload } from '@shared/queues/thumbnail/thumbnail.types';
import redis from '@shared/redis';

export const thumbnailQueue = new Queue<ThumbnailJobPayload>(
  queueNames.thumbnail,
  { connection: redis }
);

export const enqueueThumbnailJob = async (data: ThumbnailJobPayload) => {
  await thumbnailQueue.add(thumbnailJob.name, data, {
    attempts: thumbnailJob.attempts,
    backoff: thumbnailJob.backoff,
    removeOnComplete: true,
    removeOnFail: false,
  });
};
