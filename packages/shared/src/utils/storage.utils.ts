import path from 'path';
import { env } from '@shared/config/env';

export function getThumbnailPath(userId: string, fileId: string) {
  return path.join(getThumbnailsDirPath(userId), `${fileId}.webp`);
}

export function getThumbnailsDirPath(userId: string) {
  return path.join(env.STORAGE_ROOT, userId, 'thumbnails');
}
