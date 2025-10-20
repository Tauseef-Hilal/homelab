import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { spawn } from 'child_process';
import { getThumbnailPath } from '@shared/utils/storage.utils';
import { ThumbnailJobPayload } from '@shared/jobs/payload.types';

export const generateThumbnail = async ({
  fileId,
  filePath,
  mimeType,
  userId,
}: ThumbnailJobPayload) => {
  const outputPath = getThumbnailPath(userId, fileId);
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  if (mimeType.startsWith('image/')) {
    await sharp(filePath).resize(320).toFile(outputPath);
  } else if (mimeType === 'application/pdf') {
    const outputDir = path.dirname(outputPath);
    const pdfOutput = path.join(outputDir, `${fileId}-pdf.png`);

    await new Promise((resolve, reject) => {
      const child = spawn('pdftoppm', [
        '-png',
        '-f',
        '1',
        '-singlefile',
        filePath,
        path.join(outputDir, `${fileId}-pdf`),
      ]);
      child.on('close', (code) =>
        code === 0 ? resolve(0) : reject(new Error('PDF convert error'))
      );
    });

    await sharp(pdfOutput).resize(320).toFile(outputPath);
    await fs.unlink(pdfOutput);
  } else if (mimeType.startsWith('video/')) {
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: `${fileId}-video.png`,
          folder: path.dirname(outputPath),
          size: '320x?',
        })
        .on('end', resolve)
        .on('error', reject);
    });

    await sharp(path.join(path.dirname(outputPath), `${fileId}-video.png`))
      .resize(320)
      .toFile(outputPath);

    await fs.unlink(path.join(path.dirname(outputPath), `${fileId}-video.png`));
  } else {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  return {
    thumbnailPath: outputPath,
    generatedAt: new Date().toISOString(),
  };
};
