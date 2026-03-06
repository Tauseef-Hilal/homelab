import { Request, Response } from 'express';
import { idParamSchema } from '@shared/schemas/jobs/request/job.schema';
import { catchAsync } from '@server/lib/catchAsync';
import { generateETag } from '../utils/hash.util';
import { getJob } from '../services/job.service';
import { success } from '@server/lib/response';
import redis from '@shared/redis';
import { RedisKeys } from '@shared/redis/redisKeys';

export const getJobController = catchAsync(
  async (req: Request, res: Response) => {
    const jobId = idParamSchema.parse(req.params.jobId);

    const job = await getJob(req.user.id, jobId);
    const progress = await redis.get(RedisKeys.jobs.progress(job.id));

    res.status(200).json(
      success({
        job: {
          id: job.id,
          status: job.status,
          progress: Number(progress) ?? 0,
          result: job.result,
        },
      }),
    );
  },
);
