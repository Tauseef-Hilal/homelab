import { Job } from 'bullmq';
import {
  ThumbnailJobPayload,
  ThumbnailJobResult,
  jobNames,
} from '@homelab/shared/jobs';
import { generateThumbnail } from './handlers/generateThumbnail';

export const thumbnailProcessor = async (
  job: Job<ThumbnailJobPayload, ThumbnailJobResult>,
): Promise<ThumbnailJobResult> => {
  switch (job.name) {
    case jobNames.thumbnailJobName:
      return await generateThumbnail(job);
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
