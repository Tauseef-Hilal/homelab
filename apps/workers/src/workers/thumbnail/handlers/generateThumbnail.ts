import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { Job } from 'bullmq';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

import { ThumbnailJobPayload } from '@homelab/contracts/jobs';
import { getJobLogger } from '@workers/utils/logger';
import { prisma } from '@homelab/db/prisma';
import { CommonErrorCode, HttpError } from '@homelab/contracts/errors';
import { env, getStorageProvider } from '@homelab/infra/config';

export const generateThumbnail = async (job: Job<ThumbnailJobPayload>) => {
  const { fileId } = job.data;
  const logger = getJobLogger('thumbnail-worker', job);

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      name: true,
      mimeType: true,
      userId: true,
      chunks: {
        orderBy: { chunkIndex: 'asc' },
        select: {
          size: true,
          blob: { select: { blobKey: true } },
        },
      },
    },
  });

  if (!file) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'Source file does not exist',
    });
  }

  const storage = getStorageProvider();
  const outputKey = storage.keys.thumbnail(file.userId, fileId);
  const tempSuffix = `${fileId}-${job.id ?? 'no-job-id'}-${randomUUID()}`;

  try {
    if (await storage.artifacts.exists(outputKey)) {
      return {
        thumbnailPath: outputKey,
        generatedAt: new Date().toISOString(),
      };
    }

    if (
      !file.mimeType.startsWith('image/') &&
      !file.mimeType.startsWith('video/') &&
      file.mimeType !== 'application/pdf'
    ) {
      throw new HttpError({
        status: 400,
        code: CommonErrorCode.UNSUPPORTED_MEDIA_TYPE,
        message: `Unsupported mime type: ${file.mimeType}`,
      });
    }

    const chunks = file.chunks.map((chunk) => ({
      blobKey: chunk.blob.blobKey,
      size: chunk.size,
    }));

    const fileStream = storage.reader.openFile(chunks);

    switch (true) {
      case file.mimeType.startsWith('image/'):
        await generateImageThumbnail(fileStream, outputKey);
        break;

      case file.mimeType === 'application/pdf':
        await generatePdfThumbnail(fileStream, outputKey, tempSuffix);
        break;

      case file.mimeType.startsWith('video/'):
        await generateVideoThumbnail(fileStream, outputKey, tempSuffix);
        break;
    }

    return {
      thumbnailPath: outputKey,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error(
      {
        err,
        fileId,
        mimeType: file.mimeType,
        outputKey,
      },
      'Thumbnail generation failed',
    );

    throw err instanceof HttpError
      ? err
      : new HttpError({
          status: 500,
          code: CommonErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to generate thumbnail',
        });
  }
};

async function generateImageThumbnail(fileStream: Readable, outputKey: string) {
  const storage = getStorageProvider();
  const transformStream = sharp().resize(320).png();
  await storage.artifacts.put(outputKey, fileStream.pipe(transformStream));
}

async function generatePdfThumbnail(
  fileStream: Readable,
  outputKey: string,
  tempSuffix: string,
) {
  const storage = getStorageProvider();
  const sourceTempFile = path.resolve(
    path.join(env.ROOT_DIR_PATH, storage.keys.temp(`${tempSuffix}-source.pdf`)),
  );

  const outFilePrefix = path.resolve(
    path.join(env.ROOT_DIR_PATH, storage.keys.temp(`${tempSuffix}-pdf`)),
  );
  const outFilePath = `${outFilePrefix}.png`;

  try {
    await pipeline(fileStream, createWriteStream(sourceTempFile));

    await new Promise<void>((resolve, reject) => {
      let errorLog = '';
      const child = spawn('pdftoppm', [
        '-png',
        '-f',
        '1',
        '-singlefile',
        sourceTempFile,
        outFilePrefix,
      ]);

      child.stderr.on('data', (data) => {
        errorLog += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`PDF convert error: ${errorLog}`));
      });

      child.on('error', reject);
    });

    const buffer = await sharp(outFilePath).resize(320).toBuffer();
    await storage.artifacts.put(outputKey, buffer);
  } finally {
    await fs.unlink(sourceTempFile).catch(() => {});
    await fs.unlink(outFilePath).catch(() => {});
  }
}

async function generateVideoThumbnail(
  fileStream: Readable,
  outputKey: string,
  tempSuffix: string,
) {
  const storage = getStorageProvider();
  const sourceTempFile = path.resolve(
    path.join(
      env.ROOT_DIR_PATH,
      storage.keys.temp(`${tempSuffix}-source.video`),
    ),
  );
  const outActualFile = path.resolve(
    path.join(env.ROOT_DIR_PATH, storage.keys.temp(`${tempSuffix}-video.png`)),
  );

  try {
    await pipeline(fileStream, createWriteStream(sourceTempFile));

    await new Promise((resolve, reject) => {
      ffmpeg(sourceTempFile)
        .seekInput(1)
        .frames(1)
        .output(outActualFile)
        .on('end', resolve)
        .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
        .run();
    });

    const buffer = await sharp(outActualFile).resize(320).toBuffer();
    await storage.artifacts.put(outputKey, buffer);
  } finally {
    await fs.unlink(sourceTempFile).catch(() => {});
    await fs.unlink(outActualFile).catch(() => {});
  }
}
