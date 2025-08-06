import { CommonErrorCode } from '@server/errors/CommonErrorCode';
import { HttpError } from '@server/errors/HttpError';
import { prisma } from '@shared/prisma';

export async function getJob(userId: string, jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      progress: true,
      result: true,
      error: true,
      userId: true,
    },
  });

  if (!job) {
    return new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'The requested job does not exist',
    });
  }

  if (job.userId != userId) {
    return new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: 'You dont have the permission to access this job',
    });
  }

  return job;
}
