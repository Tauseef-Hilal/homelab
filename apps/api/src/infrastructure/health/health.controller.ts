import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { runHealthChecks } from './health.service';

export const healthController = catchAsync(
  async (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'homelap-api',
      uptime: process.uptime(),
    });
  },
);

export const readyController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await runHealthChecks();

    if (result.status === 'error') {
      return res.status(503).json(result);
    }

    res.json(result);
  },
);
