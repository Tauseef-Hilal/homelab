export const queueNames = {
  computeQueueName: 'compute-queue',
  fileIOQueueName: 'file-io-queue',
} as const;

export const jobNames = {
  generateThumbnailJobName: 'GENERATE_THUMBNAIL',
  copyJobName: 'COPY_FILES',
  moveJobName: 'MOVE_FILES',
  deleteJobName: 'DELETE_FILES',
  zipJobName: 'ZIP_FOLDER',
  uploadCleanupJobName: 'CLEANUP_UPLOAD',
};
