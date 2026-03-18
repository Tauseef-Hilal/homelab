import { Job } from 'bullmq';
import {
  CopyJobPayload,
  DeleteJobPayload,
  JobPayload,
  MoveJobPayload,
  UploadCleanupJobPayload,
  ZipJobPayload,
  jobNames,
} from '@homelab/shared/jobs';
import { copyItems } from './handlers/copyItems';
import { moveItems } from './handlers/moveItems';
import { deleteItems } from './handlers/deleteItems';
import { zipItems } from './handlers/zipItems';
import { cleanupUpload } from './handlers/cleanupUpload';

export const fileIOJobProcessor = async (job: Job<JobPayload>) => {
  switch (job.name) {
    case jobNames.copyJobName:
      return await copyItems(job as Job<CopyJobPayload>);
    case jobNames.moveJobName:
      return await moveItems(job as Job<MoveJobPayload>);
    case jobNames.deleteJobName:
      return await deleteItems(job as Job<DeleteJobPayload>);
    case jobNames.zipJobName:
      return await zipItems(job as Job<ZipJobPayload>);
    case jobNames.uploadCleanupJobName:
      return await cleanupUpload(job as Job<UploadCleanupJobPayload>);
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
