import { JobStatus } from '@prisma/client';
import { prisma } from '@homelab/db/prisma';
import { redis, RedisKeys } from '@homelab/infra/redis';

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
