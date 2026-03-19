import { timeout } from '@server/lib/timeout';
import { HealthCheckResult } from '@server/types/health';
import { redis } from '@homelab/infra/redis';

export async function checkRedis(): Promise<HealthCheckResult> {
  try {
    await Promise.race([redis.ping(), timeout()]);

    return {
      name: 'redis',
      status: 'ok',
    };
  } catch (err) {
    return {
      name: 'redis',
      status: 'error',
      message:
        err instanceof Error && err.message === 'timeout'
          ? 'redis timeout'
          : 'redis unreachable',
    };
  }
}
