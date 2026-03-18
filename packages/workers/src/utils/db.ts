import { JobStatus } from '@prisma/client';
import { prisma } from '@homelab/shared/prisma';
import { redis, RedisKeys } from '@homelab/shared/redis';

export async function updateJob(
  jobId: string,
  update: {
    status?: JobStatus;
    attempts?: number;
    result?: object;
    error?: string;
  },
) {
  await prisma.job.update({ where: { id: jobId }, data: update });
}
