export const RedisKeys = {
  auth: {
    otp: (userId: string) => `auth:otp:${userId}`,
    allowPasswordChange: (userId: string) =>
      `auth:allowPasswordChange:${userId}`,
  },
  jobs: {
    progress: (jobId: string) => `jobs:${jobId}:progress`,
  },
};
