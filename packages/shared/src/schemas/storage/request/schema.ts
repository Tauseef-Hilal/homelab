import { z } from 'zod';

export const copyItemsSchema = z.object({
  destinationFolderId: z.uuidv4(),
  items: z.array(
    z.object({ type: z.enum(['folder', 'file']), id: z.uuidv4() })
  ),
});

export type CopyItemsInput = z.infer<typeof copyItemsSchema>;
