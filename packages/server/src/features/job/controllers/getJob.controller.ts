import { Request, Response } from 'express';
import { idParamSchema } from '../schemas/job.schema';
import { catchAsync } from '@server/lib/catchAsync';
import { generateETag } from '../utils/hash.util';
import { getJob } from '../services/job.service';

export const getJobController = catchAsync(
  async (req: Request, res: Response) => {
    const jobId = idParamSchema.parse(req.params.jobId);

    const job = await getJob(req.user.id, jobId);
    const etag = generateETag(job);

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    res.setHeader('ETag', etag);
    res.status(200).json({ success: true, job });
  }
);
