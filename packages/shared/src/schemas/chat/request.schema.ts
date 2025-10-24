import { z } from 'zod';

export const getBroadcastMessagesSchema = z.object({
  limit: z.optional(z.coerce.number()),
  offsetId: z.optional(z.uuid()),
  offsetSentAt: z.optional(z.string()),
});

export type GetBroadcastMessagesInput = z.infer<
  typeof getBroadcastMessagesSchema
>;
