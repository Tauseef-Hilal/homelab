import { z } from 'zod';
import { Visibility } from '@prisma/client';

export const uploadFileSchema = z.object({
  folderId: z.optional(z.uuidv4()),
  visibility: z.enum([
    Visibility.public,
    Visibility.private,
    Visibility.shared,
  ]),
});

export const deleteFileSchema = z.object({
  fileId: z.uuidv4(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
