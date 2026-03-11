import { RateLimitPolicy } from '@homelab/shared/types';

export const RedisKeys = {
  auth: {
    otp: (userId: string) => `auth:otp:${userId}`,
    allowPasswordChange: (userId: string) =>
      `auth:allowPasswordChange:${userId}`,
  },
  jobs: {
    progress: (jobId: string) => `jobs:${jobId}:progress`,
  },
  rateLimit: {
    getKey: (id: string, policy: RateLimitPolicy) =>
      `rate:${policy.scope}:${id}:${policy.resource}:${policy.action}`,
  },
};
