import { Job } from 'bullmq';
import { JobPayload } from '@homelab/shared/jobs';
import { loggerWithContext } from '@homelab/shared/logging';

export function getJobLogger(
  service: 'io-worker' | 'thumbnail-worker',
  job?: Job<JobPayload>,
) {
  return loggerWithContext({
    service: service,
    jobId: job?.id ?? '',
    jobName: job?.name,
    userId: job?.data.userId,
    attempts: job?.attemptsMade,
    payload: job?.data,
  });
}
