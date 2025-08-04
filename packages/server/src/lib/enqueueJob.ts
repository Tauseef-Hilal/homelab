import { Job } from '@prisma/client';
import { prisma } from '@shared/prisma';

export const enqueueJob =
  <T>(enqueue: (requestId: string, payload: T) => Promise<void>) =>
  async (
    requestId: string,
    payload: T & { prismaJobId: string }
  ): Promise<Job> => {
    const job = await prisma.job.create({
      data: { requestId, payload: payload as object },
    });

    payload.prismaJobId = job.id;
    await enqueue(requestId, payload);

    return job;
  };
