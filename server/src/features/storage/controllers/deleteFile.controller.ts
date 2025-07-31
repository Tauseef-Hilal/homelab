import { Request, Response } from 'express';
import { deleteFileSchema } from '../schemas/storage.schema';
import { catchAsync } from '@/lib/catchAsync';
import * as StorageService from '../services/storage.service';
import { prisma } from '@/lib/prisma';

export const deleteFileController = catchAsync(
  async (req: Request, res: Response) => {
    const { fileId } = deleteFileSchema.parse(req.body);
    req.user = await prisma.user.findFirst();

    await StorageService.deleteFile(req.user.id, fileId);
    return res.status(204);
  }
);
