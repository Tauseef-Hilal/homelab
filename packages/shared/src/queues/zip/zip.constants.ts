export const zipJob = {
  name: 'zip-folder',
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
};