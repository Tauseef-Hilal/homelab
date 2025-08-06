import { Job } from '@prisma/client';
import { prisma } from '@shared/prisma';
import { JobPayload } from '@shared/queues/queue.types';

export const enqueueJob =
  <T extends JobPayload>(enqueue: (payload: T) => Promise<void>) =>
  async (payload: T): Promise<Job> => {
    const job = await prisma.job.create({
      data: {
        userId: payload.userId,
        requestId: payload.requestId,
        payload: payload as object,
      },
    });

    payload.prismaJobId = job.id;
    await enqueue(payload);

    return job;
  };
