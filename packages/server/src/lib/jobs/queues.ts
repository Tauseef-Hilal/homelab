import { Queue } from 'bullmq';
import { JobPayload } from '@shared/queues/queue.types';
import { prisma } from '@shared/prisma';
import redis from '@shared/redis';

export const queue = new Queue('fileOperations', {
  connection: redis,
});

export const enqueueJob = async <T extends JobPayload>(
  name: string,
  payload: T,
  attempts: number = 0,
  delay: number = 5000,
) => {
  const job = await prisma.job.create({
    data: {
      name,
      userId: payload.userId,
      requestId: payload.requestId,
      payload: payload as object,
    },
  });

  payload.prismaJobId = job.id;

  await queue.add(name, payload, {
    attempts,
    backoff: {
      type: 'exponential',
      delay
    },
    removeOnComplete: true,
    removeOnFail: true,
  });

  return { id: job.id };
};
