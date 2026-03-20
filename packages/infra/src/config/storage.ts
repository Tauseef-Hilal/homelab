import { createStoragePlatform, StoragePlatform } from '@homelab/storage';
import { env } from './env';

let storageProvider: StoragePlatform | null = null;

export function getStorageProvider(): StoragePlatform {
  if (storageProvider) return storageProvider;

  if (env.STORAGE_PROVIDER === 'local') {
    storageProvider = createStoragePlatform({
      provider: 'local',
      localRootDir: env.ROOT_DIR_PATH,
    });
  } else if (env.STORAGE_PROVIDER === 's3') {
    // S3
  } else {
    throw new Error(
      `Unsupported or missing STORAGE_PROVIDER: ${env.STORAGE_PROVIDER}. Please check your environment variables.`,
    );
  }

  return storageProvider!;
}
