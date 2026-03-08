import { timeout } from '@server/lib/timeout';
import { HealthCheckResult } from '@server/types/health';
import { prisma } from '@shared/prisma';

export async function checkPostgres(): Promise<HealthCheckResult> {
  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout()]);

    return {
      name: 'postgres',
      status: 'ok',
    };
  } catch (err) {
    return {
      name: 'postgres',
      status: 'error',
      message:
        err instanceof Error && err.message === 'timeout'
          ? 'database timeout'
          : 'database unreachable',
    };
  }
}
