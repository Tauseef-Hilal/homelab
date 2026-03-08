import { Job } from 'bullmq';
import { JobPayload } from '@shared/jobs/payload.types';
import { loggerWithContext } from '@shared/logging';

export function getJobLogger(
  service: 'io-worker' | 'thumbnail-worker',
  job?: Job<JobPayload>,
) {
  return loggerWithContext({
    service: service,
    jobId: job?.data.prismaJobId,
    jobName: job?.name,
    userId: job?.data.userId,
    attempts: job?.attemptsMade,
    payload: job?.data,
  });
}
