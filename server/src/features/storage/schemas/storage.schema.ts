import { z } from 'zod';
import { Visibility } from '@prisma/client';

export const uploadFileSchema = z.object({
  folderId: z.optional(z.string()),
  visibility: z.enum([
    Visibility.public,
    Visibility.private,
    Visibility.shared,
  ]),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
