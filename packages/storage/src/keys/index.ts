import type { StorageKeyFactory } from '../contracts';

export const defaultKeyFactory: StorageKeyFactory = {
  blob: (hash: string) =>
    `blobs/${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash}`,

  thumbnail: (userId: string, fileId: string) =>
    `thumbnails/${userId}/${fileId}.webp`,

  downloadPackage: (id: string) => `downloads/${id}.zip`,

  temp: (name: string) => `temp/${Date.now()}-${name}`,
};
