import { Job } from 'bullmq';
import {
  CopyJobPayload,
  DeleteJobPayload,
  JobPayload,
  MoveJobPayload,
  ZipJobPayload,
} from '@shared/jobs/payload.types';
import { jobNames } from '@shared/jobs/constants';
import { copyItems } from './handlers/copyItems';
import { moveItems } from './handlers/moveItems';
import { deleteItems } from './handlers/deleteItems';
import { zipItems } from './handlers/zipItems';

export const fileIOJobProcessor = async (job: Job<JobPayload>) => {
  switch (job.name) {
    case jobNames.copyJobName:
      return await copyItems(job.data as CopyJobPayload);
    case jobNames.moveJobName:
      return await moveItems(job.data as MoveJobPayload);
    case jobNames.deleteJobName:
      return await deleteItems(job.data as DeleteJobPayload);
    case jobNames.zipJobName:
      return await zipItems(job.data as ZipJobPayload);
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
