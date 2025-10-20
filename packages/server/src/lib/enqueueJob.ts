import { prisma } from '@shared/prisma';
import { JobPayload } from '@shared/jobs/payload.types';

export const enqueueJob =
  <T extends JobPayload>(
    enqueue: (name: string, payload: T) => Promise<void>
  ) =>
  async (name: string, payload: T) => {
    const job = await prisma.job.create({
      data: {
        name,
        userId: payload.userId,
        requestId: payload.requestId,
        payload: payload as object,
      },
    });

    payload.prismaJobId = job.id;
    await enqueue(name, payload);

    return job;
  };
