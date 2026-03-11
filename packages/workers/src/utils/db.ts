import { JobStatus } from '@prisma/client';
import { prisma } from '@homelab/shared/prisma';

export async function updateJob(
  jobId: string,
  update: {
    status?: JobStatus;
    attempts?: number;
    result?: object;
  }
) {
  await prisma.job.update({ where: { id: jobId }, data: update });
}
