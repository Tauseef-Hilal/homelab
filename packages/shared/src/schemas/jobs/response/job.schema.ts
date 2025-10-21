import { z } from 'zod';

export const getJobSchema = z.object({
  job: z.object({
    id: z.uuidv4(),
    status: z.enum(['enqueued', 'processing', 'completed', 'failed']),
    progress: z.number(),
    result: z.json(),
  }),
});

export type GetJobOutput = z.infer<typeof getJobSchema>;
