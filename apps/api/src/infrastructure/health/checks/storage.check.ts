import { timeout } from '@server/lib/timeout';
import { HealthCheckResult } from '@server/types/health';
import { env } from '@homelab/infra/config';
import fs from 'fs/promises';
import path from 'path';

export async function checkStorage(): Promise<HealthCheckResult> {
  try {
    await Promise.race([
      Promise.all([
        fs.access(path.resolve(env.THUMBNAIL_DIR_PATH)),
        fs.access(path.resolve(env.BLOB_DIR_PATH)),
        fs.access(path.resolve(env.TEMP_DIR_PATH)),
      ]),
      timeout(3000),
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
