import { Job } from 'bullmq';
import {
  GenerateThumbnailJobPayload,
  GenerateThumbnailJobResult,
  jobNames,
} from '@homelab/contracts/jobs';
import { generateThumbnail } from './handlers/generateThumbnail';

export const computeProcessor = async (
  job: Job<GenerateThumbnailJobPayload, GenerateThumbnailJobResult>,
): Promise<GenerateThumbnailJobResult> => {
  switch (job.name) {
    case jobNames.generateThumbnailJobName:
      return await generateThumbnail(job);
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
