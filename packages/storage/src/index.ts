import { LocalBlobStore, LocalArtifactStore } from './provides/local';
import { defaultKeyFactory } from './keys';
import type { StoragePlatform } from './contracts';
import { FileContentReader } from './services/FileContentReader';

export { defaultKeyFactory } from './keys';
export * from './utils/quota.utils';
export * from './utils/startup.utils';
export * from './utils/storage.utils';
export * from './contracts';

export interface StorageConfig {
  provider: 'local' | 's3';
  localRootDir: string;
}

export function createStoragePlatform(config: StorageConfig): StoragePlatform {
  if (config.provider === 'local') {
    const blobStore = new LocalBlobStore(config.localRootDir);
    return {
      blobs: blobStore,
      keys: defaultKeyFactory,
      artifacts: new LocalArtifactStore(config.localRootDir),
      reader: new FileContentReader(blobStore),
    };
  }

  throw new Error(
    `Storage provider '${config.provider}' is not supported yet.`,
  );
}
