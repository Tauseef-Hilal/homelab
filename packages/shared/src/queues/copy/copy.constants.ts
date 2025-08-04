export const copyJob = {
  name: 'copy-folder',
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
};