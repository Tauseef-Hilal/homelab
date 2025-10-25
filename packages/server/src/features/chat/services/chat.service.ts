import { prisma } from '@shared/prisma';
export async function getBroadcastMessages(
  cursorId?: string,
  cursorSentAt?: string,
  limit?: number
) {
  const take = limit ?? 30;
  const where =
    cursorId && cursorSentAt
      ? {
          OR: [
            { sentAt: { lte: new Date(cursorSentAt) } },
            {
              sentAt: new Date(cursorSentAt),
              id: { lte: cursorId },
            },
          ],
        }
      : undefined;

  const messages = await prisma.broadcastMessage.findMany({
    where,
    include: { author: true },
    orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
  });

  if (messages.length > take) {
    const msg = messages.pop()!;
    return {
      messages,
      nextCursor: { id: msg.id, sentAt: msg.sentAt.toISOString() },
    };
  }

  return { messages, nextCursor: null };
}
