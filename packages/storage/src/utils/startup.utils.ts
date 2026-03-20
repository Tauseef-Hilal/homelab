import { prisma } from '@homelab/db/prisma';

export async function ensureSystemStatsRow() {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      'LOCK TABLE "SystemStats" IN ACCESS EXCLUSIVE MODE',
    );

    const existingStats = await tx.systemStats.findFirst({
      select: { id: true },
    });

    if (existingStats) {
      return existingStats;
    }

    return tx.systemStats.create({
      data: {
        totalStorageUsed: 0,
      },
      select: { id: true },
    });
  });
}

export async function initializeStorageRuntime() {
  await ensureSystemStatsRow();
}
