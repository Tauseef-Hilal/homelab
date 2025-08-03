export const queueNames = {
  thumbnail: 'thumbnail',
};

export const thumbnailJob = {
  name: 'generate-thumbnail',
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,
  },
};
