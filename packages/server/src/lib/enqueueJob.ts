import { prisma } from '@homelab/shared/prisma';
import { JobPayload } from '@homelab/shared/jobs';

export const enqueueJob =
  <T extends JobPayload>(
    enqueue: (name: string, payload: T, jobId: string) => Promise<void>,
  ) =>
  async (name: string, payload: T, idempotencyKey: string) => {
    if (!idempotencyKey) {
      throw new Error('idempotencyKey required');
    }

    const jobId = idempotencyKey;

    const existing = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (existing) return existing;

    const job = await prisma.job.create({
      data: {
        id: jobId,
        name,
        userId: payload.userId,
        requestId: payload.requestId,
        payload: payload as object,
      },
    });

    await enqueue(name, payload, jobId);

    return job;
  };
