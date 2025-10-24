import { prisma } from '@shared/prisma';

export async function getBroadcastMessages(
  offsetId?: string,
  offsetSentAt?: string,
  limit?: number
) {
  const where =
    offsetId && offsetSentAt
      ? {
          OR: [
            { sentAt: { lt: new Date(offsetSentAt) } },
            {
              sentAt: new Date(offsetSentAt),
              id: { lt: offsetId },
            },
          ],
        }
      : undefined;

  const messages = await prisma.broadcastMessage.findMany({
    where,
    include: { author: true },
    orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
    take: (limit ?? 30) + 1,
  });

  return { messages, hasMoreData: messages.length > (limit ?? 30) };
}
