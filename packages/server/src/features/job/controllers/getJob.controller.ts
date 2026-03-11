import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/shared/schemas/jobs';
import { catchAsync } from '@server/lib/catchAsync';
import { getJob } from '../services/job.service';
import { success } from '@server/lib/response';
import { redis, RedisKeys } from '@homelab/shared/redis';

export const getJobController = catchAsync(
  async (req: Request, res: Response) => {
    const jobId = requestSchemas.idParamSchema.parse(req.params.jobId);

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
