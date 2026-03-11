import { CommonErrorCode } from '@homelab/shared/errors';
import { HttpError } from '@homelab/shared/errors';
import { prisma } from '@homelab/shared/prisma';

export async function getJob(userId: string, jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      result: true,
      error: true,
      userId: true,
    },
  });

  if (!job) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'The requested job does not exist',
    });
  }

  if (job.userId != userId) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: 'You dont have the permission to access this job',
    });
  }

  return job;
}
