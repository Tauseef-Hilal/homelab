import { timeout } from '@server/lib/timeout';
import { HealthCheckResult } from '@server/types/health';
import { env } from '@homelab/shared/config';
import fs from 'fs/promises';
import path from 'path';

export async function checkStorage(): Promise<HealthCheckResult> {
  try {
    await Promise.race([
      fs.access(path.resolve(env.MEDIA_DIR_PATH)),
      timeout(),
    ]);

    return {
      name: 'storage',
      status: 'ok',
    };
  } catch (err) {
    return {
      name: 'storage',
      status: 'error',
      message:
        err instanceof Error && err.message === 'timeout'
          ? 'storage timeout'
          : 'upload directory inaccessible',
    };
  }
}
