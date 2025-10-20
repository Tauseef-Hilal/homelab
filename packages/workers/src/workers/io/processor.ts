import { Job } from 'bullmq';
import {
  CopyJobPayload,
  JobPayload,
  ZipJobPayload,
} from '@shared/jobs/payload.types';
import { jobNames } from '@shared/jobs/constants';
import { copyFolder } from './handlers/copyFolder';
import { zipFolder } from './handlers/zipFolder';

export const fileIOJobProcessor = async (job: Job<JobPayload>) => {
  switch (job.name) {
    case jobNames.copyJobName:
      return await copyFolder(job.data as CopyJobPayload);
    case jobNames.zipJobName:
      return await zipFolder(job.data as ZipJobPayload);
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
