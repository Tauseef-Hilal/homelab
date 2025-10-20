import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { copyItemsSchema } from '@shared/schemas/storage/request/schema';
import { enqueueCopyJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@shared/jobs/constants';
import { success } from '@server/lib/response';
import { prisma } from '@shared/prisma';
import { ensureFolderExists, ensureUserIsOwner } from '../utils/folder.util';

export const copyItems = catchAsync(async (req: Request, res: Response) => {
  const { destinationFolderId, items } = copyItemsSchema.parse(req.body);

  const targetFolder = await prisma.folder.findUnique({
    where: { id: destinationFolderId },
  });

  if (destinationFolderId) {
    ensureFolderExists(targetFolder);
    ensureUserIsOwner(targetFolder!, req.user.userId);
  }

  // TODO: Impose storage limits

  const job = enqueueCopyJob(jobNames.copyJobName, {
    items,
    destFolderId: destinationFolderId,
    prismaJobId: '',
    requestId: req.id,
    userId: req.user.id,
  });

  res.status(200).json(success({ job }, 'Copying items in progress'));
});
