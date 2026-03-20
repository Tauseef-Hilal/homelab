import { getStorageProvider } from '@homelab/infra/config/storage';
import { timeout } from '@server/lib/timeout';
import { HealthCheckResult } from '@server/types/health';

export async function checkStorage(): Promise<HealthCheckResult> {
  try {
    const storage = getStorageProvider();

    await Promise.race([
      Promise.all([
        storage.blobs.checkHealth(),
        storage.artifacts.checkHealth(),
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
          : 'storage inaccessible or misconfigured',
    };
  }
}
