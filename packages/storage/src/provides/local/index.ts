import fs, { createReadStream, createWriteStream } from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { Readable } from 'stream';
import type { BlobStore, ArtifactStore } from '../../contracts';
import { pipeline } from 'stream/promises';

export class LocalBlobStore implements BlobStore {
  constructor(private readonly rootDir: string) {}

  private getPath(key: string): string {
    // SECURITY: Resolve the absolute path and ensure it stays inside rootDir
    const safeRootDir = path.resolve(this.rootDir);
    const fullPath = path.resolve(safeRootDir, key);
    
    if (!fullPath.startsWith(safeRootDir)) {
      throw new Error('Invalid storage key: Directory traversal detected');
    }
    
    return fullPath;
  }

  async checkHealth(): Promise<void> {
    try {
      await fsp.mkdir(this.rootDir, { recursive: true });
      await fsp.access(this.rootDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error: any) {
      throw new Error(`BlobStore directory inaccessible: ${error.message}`);
    }
  }

  async putIfAbsent(key: string, data: Buffer): Promise<{ created: boolean }> {
    const fullPath = this.getPath(key);
    await fsp.mkdir(path.dirname(fullPath), { recursive: true });

    try {
      // 'wx' flag fails if the file already exists (atomic operation)
      await fsp.writeFile(fullPath, data, { flag: 'wx' });
      return { created: true };
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        return { created: false };
      }
      throw error;
    }
  }

  openRead(key: string, range?: { start?: number; end?: number }): Readable {
    return fs.createReadStream(this.getPath(key), range);
  }

  async deleteIfPresent(key: string): Promise<void> {
    try {
      await fsp.unlink(this.getPath(key));
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteIfPresent(key)));
  }

  async stat(key: string): Promise<{ size: number } | null> {
    try {
      const stats = await fsp.stat(this.getPath(key));
      return { size: stats.size };
    } catch (error: any) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }
}

export class LocalArtifactStore implements ArtifactStore {
  constructor(private readonly rootDir: string) {}

  private getPath(key: string): string {
    // SECURITY: Prevent path traversal here as well
    const safeRootDir = path.resolve(this.rootDir);
    const fullPath = path.resolve(safeRootDir, key);
    
    if (!fullPath.startsWith(safeRootDir)) {
      throw new Error('Invalid storage key: Directory traversal detected');
    }
    
    return fullPath;
  }

  async checkHealth(): Promise<void> {
    try {
      await fsp.mkdir(this.rootDir, { recursive: true });
      await fsp.access(this.rootDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error: any) {
      throw new Error(`ArtifactStore directory inaccessible: ${error.message}`);
    }
  }

  async put(key: string, data: Buffer | Readable): Promise<void> {
    const fullPath = this.getPath(key);
    await fsp.mkdir(path.dirname(fullPath), { recursive: true });

    if (Buffer.isBuffer(data)) {
      await fsp.writeFile(fullPath, data);
    } else {
      const writeStream = fs.createWriteStream(fullPath);
      await pipeline(data, writeStream);
    }
  }

  openRead(key: string, range?: { start?: number; end?: number }): Readable {
    return fs.createReadStream(this.getPath(key), range);
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const source = createReadStream(this.getPath(sourceKey));
    const dest = createWriteStream(this.getPath(destKey));
    await pipeline(source, dest);
  }

  async deleteIfPresent(key: string): Promise<void> {
    try {
      await fsp.unlink(this.getPath(key));
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteIfPresent(key)));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fsp.access(this.getPath(key));
      return true;
    } catch {
      return false;
    }
  }
}