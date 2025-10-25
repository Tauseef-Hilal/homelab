import { z } from 'zod';

export const getBroadcastMessagesSchema = z.object({
  limit: z.optional(z.coerce.number()),
  cursorId: z.optional(z.uuid()),
  cursorSentAt: z.optional(z.string()),
});

export type GetBroadcastMessagesInput = z.infer<
  typeof getBroadcastMessagesSchema
>;
