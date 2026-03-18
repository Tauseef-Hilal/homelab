import { Visibility } from '@prisma/client';
import { prisma } from '@homelab/shared/prisma';
import { CommonErrorCode, HttpError } from '@homelab/shared/errors';

export async function getFileMeta(userId: string, fileId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      name: true,
      userId: true,
      mimeType: true,
      visibility: true,
      size: true,
      chunks: {
        orderBy: { chunkIndex: 'asc' },
        select: {
          size: true,
          blob: { select: { storageKey: true, size: true } },
        },
      },
    },
  });

  if (!file) {
    throw new HttpError({
      status: 404,
      code: CommonErrorCode.NOT_FOUND,
      message: 'File does not exist.',
    });
  }

  if (file.userId != userId && file.visibility == Visibility.public) {
    throw new HttpError({
      status: 403,
      code: CommonErrorCode.FORBIDDEN,
      message: 'You do not have the permission to download this file',
    });
  }

  return file;
}
