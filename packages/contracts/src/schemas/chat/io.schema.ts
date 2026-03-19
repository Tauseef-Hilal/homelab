import { z } from 'zod';

export const broadcastMessageSchema = z.object({
  id: z.uuid(),
  content: z.string().min(1),
  authorId: z.uuid(),
  sentAt: z.string(),
  author: z.object({
    id: z.uuid(),
    email: z.email(),
    username: z.string(),
    role: z.enum(['USER', 'ADMIN']),
  }),
});

export type BroadcastMessage = z.infer<typeof broadcastMessageSchema>;
