import { JobStatus } from '@prisma/client';
import { prisma } from '@shared/prisma';

export async function updateJob(
  jobId: string,
  update: { status?: JobStatus; progress?: number; attempts?: number }
) {
  await prisma.job.update({ where: { id: jobId }, data: update });
}
