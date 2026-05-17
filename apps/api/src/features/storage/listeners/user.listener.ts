import { domainEvents, DomainEvent } from '@server/lib/events';
import { prisma } from '@homelab/db/prisma';
import { logger } from '@homelab/infra/logging';

export function registerStorageListeners() {
  domainEvents.on(DomainEvent.USER_CREATED, async (payload: { userId: string }) => {
    try {
      await prisma.folder.create({
        data: { name: '', fullPath: '/', userId: payload.userId, depth: 0 },
      });
      logger.info({ userId: payload.userId }, 'Root folder created for new user');
    } catch (error) {
      logger.error({ userId: payload.userId, error }, 'Failed to create root folder for new user');
    }
  });
}
