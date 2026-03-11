import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/shared/schemas/storage';
import { enqueueCopyJob } from '@server/lib/jobs/fileIOQueue';
import { jobNames } from '@homelab/shared/jobs';
import { success } from '@server/lib/response';
import { prisma } from '@homelab/shared/prisma';
import { ensureFolderExists, ensureUserIsOwner } from '../utils/folder.util';

export const copyItemsController = catchAsync(
  async (req: Request, res: Response) => {
    const { destinationFolderId, items } = requestSchemas.copyItemsSchema.parse(
      req.body,
    );

    const targetFolder = await prisma.folder.findUnique({
      where: { id: destinationFolderId },
    });

    if (destinationFolderId) {
      ensureFolderExists(targetFolder);
      ensureUserIsOwner(targetFolder!, req.user.id);
    }

    const job = await enqueueCopyJob(jobNames.copyJobName, {
      items,
      destFolderId: destinationFolderId,
      prismaJobId: '',
      requestId: req.id,
      userId: req.user.id,
    });

    res
      .status(200)
      .json(success({ job: { id: job.id } }, 'Copying items in progress'));
  },
);
