import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { Job } from 'bullmq';
import {
  getFileStream,
  getTempFilePath,
  getThumbnailPath,
} from '@homelab/shared/utils';
import { ThumbnailJobPayload } from '@homelab/shared/jobs';
import { getJobLogger } from '@workers/utils/logger';
import { prisma } from '@homelab/shared/prisma';
import { CommonErrorCode, HttpError } from '@homelab/shared/errors';
import { env } from '@homelab/shared/config';

export const generateThumbnail = async (job: Job<ThumbnailJobPayload>) => {
  const { fileId, userId } = job.data;
  const logger = getJobLogger('thumbnail-worker', job);

  const file = await prisma.file.findUnique({
    where: { id: fileId, userId },
    select: {
      name: true,
      mimeType: true,
      chunks: {
        orderBy: { chunkIndex: 'asc' },
        select: { size: true, blob: { select: { storageKey: true } } },
      },
    },
  });

  if (!file) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'Source file doesnt not exist',
    });
  }

  const srcPath = getTempFilePath(fileId);

  try {
    await pipeline(getFileStream(file), createWriteStream(srcPath));

    const outputPath = getThumbnailPath(userId, fileId);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    switch (true) {
      case file.mimeType.startsWith('image/'):
        await generateImageThumbnail(srcPath, outputPath);
        break;

      case file.mimeType === 'application/pdf':
        await generatePdfThumbnail(srcPath, outputPath, fileId);
        break;

      case file.mimeType.startsWith('video/'):
        await generateVideoThumbnail(srcPath, outputPath, fileId);
        break;

      default:
        throw new HttpError({
          status: 400,
          code: CommonErrorCode.UNSUPPORTED_MEDIA_TYPE,
          message: `Unsupported mime type: ${file.mimeType}`,
        });
    }

    return {
      thumbnailPath: outputPath,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to generate thumbnail',
        });
  } finally {
    // ensure temp file cleanup
    await fs.unlink(srcPath).catch(() => {});
  }
};

async function generateImageThumbnail(srcPath: string, outputPath: string) {
  await sharp(srcPath).resize(320).toFile(outputPath);
}

async function generatePdfThumbnail(
  srcPath: string,
  outputPath: string,
  fileId: string,
) {
  const tempFile = path.join(env.TEMP_DIR_PATH, `${fileId}-pdf.png`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn('pdftoppm', [
      '-png',
      '-f',
      '1',
      '-singlefile',
      srcPath,
      path.join(env.TEMP_DIR_PATH, `${fileId}-pdf`),
    ]);

    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error('PDF convert error')),
    );

    child.on('error', reject);
  });

  await sharp(tempFile).resize(320).toFile(outputPath);
  await fs.unlink(tempFile);
}

async function generateVideoThumbnail(
  srcPath: string,
  outputPath: string,
  fileId: string,
) {
  const tempFile = path.join(env.TEMP_DIR_PATH, `${fileId}-video.png`);

  await new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .seekInput(1) // grab frame at 1s
      .frames(1)
      .output(tempFile)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  await sharp(tempFile).resize(320).toFile(outputPath);
  await fs.unlink(tempFile);
}
