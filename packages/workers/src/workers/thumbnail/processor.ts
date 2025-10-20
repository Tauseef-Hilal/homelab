import { Job } from 'bullmq';
import { ThumbnailJobPayload } from '@shared/jobs/payload.types';
import { ThumbnailJobResult } from '@shared/jobs/result.types';
import { jobNames } from '@shared/jobs/constants';
import { generateThumbnail } from './handlers/generateThumbnail';


export const thumbnailProcessor = async (
  job: Job<ThumbnailJobPayload, ThumbnailJobResult>
): Promise<ThumbnailJobResult> => {
  switch (job.name) {
    case jobNames.thumbnailJobName:
      return await generateThumbnail(job.data);
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
