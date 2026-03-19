import path from 'path';
import { mkdir } from 'fs/promises';
import { prisma } from '@homelab/db/prisma';
import { env } from '@homelab/infra/config';

const runtimeDirectories = [
  env.BLOB_DIR_PATH,
  env.THUMBNAIL_DIR_PATH,
  env.LOG_DIR_PATH,
  env.TEMP_DIR_PATH,
  env.TRASH_DIR_PATH,
];

export async function ensureRuntimeDirectories() {
  const directories = [
    ...new Set(runtimeDirectories.map((dir) => path.resolve(dir))),
  ];

  await Promise.all(
    directories.map((directory) => mkdir(directory, { recursive: true })),
  );
}

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
  await ensureRuntimeDirectories();
  await ensureSystemStatsRow();
}
