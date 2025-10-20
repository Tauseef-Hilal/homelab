import { z } from 'zod';

export const copyItemsSchema = z.object({
  job: z.object({
    id: z.uuidv4(),
  }),
});

export type CopyItemsOutput = z.infer<typeof copyItemsSchema>;
