import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { env } from '@shared/config/env';
import { mediaConstants } from '@shared/constants/media.constants';

export function getFileExtension(filename: string): string {
  const ext = path.extname(filename || '').toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

export async function copyFileOnDisk(src: string, dest: string) {
  await pipeline(
    Readable.from((await fs.open(src)).createReadStream()),
    createWriteStream(dest)
  );
}

export function getThumbnailPath(userId: string, fileId: string) {
  return path.join(getThumbnailsDirPath(userId), `${fileId}.webp`);
}

export function getThumbnailsDirPath(userId: string) {
  return path.join(
    env.MEDIA_DIR_PATH,
    userId,
    mediaConstants.thumbnailsDirName
  );
}

export function getOriginalFilePath(
  userId: string,
  fileId: string,
  ext: string
) {
  return path.join(getOriginalsDirPath(userId), `${fileId}.${ext}`);
}

export function getOriginalsDirPath(userId: string) {
  return path.join(env.MEDIA_DIR_PATH, userId, mediaConstants.originalsDirName);
}

export function getTempFilePath(fileName: string) {
  return path.join(env.TEMP_DIR_PATH, fileName);
}
