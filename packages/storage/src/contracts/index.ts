import type { Readable } from 'stream';
import { FileContentReader } from '../services/FileContentReader';

export interface BlobStore {
  putIfAbsent(key: string, data: Buffer): Promise<{ created: boolean }>;
  openRead(key: string, range?: { start?: number; end?: number }): Readable;
  deleteIfPresent(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  stat(key: string): Promise<{ size: number } | null>;
  checkHealth(): Promise<void>;
}

export interface ArtifactStore {
  put(key: string, data: Buffer | Readable): Promise<void>;
  openRead(key: string, range?: { start?: number; end?: number }): Readable;
  copy(sourceKey: string, destKey: string): Promise<void>;
  deleteIfPresent(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  exists(key: string): Promise<boolean>;
  checkHealth(): Promise<void>;
}

export interface StorageKeyFactory {
  blob(hash: string): string;
  thumbnail(userId: string, fileId: string): string;
  downloadPackage(id: string): string;
  temp(name: string): string;
}

export interface StoragePlatform {
  blobs: BlobStore;
  artifacts: ArtifactStore;
  keys: StorageKeyFactory;
  reader: FileContentReader;
}
