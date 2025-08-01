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

export const renameFileSchema = z.object({
  fileId: z.uuidv4(),
  newName: z
  .string()
  .min(1, 'Name cannot be empty')
  .max(255, 'Name too long')
  .refine(
    (name) =>
      !name.includes('.') && !name.includes('/') && !name.includes('\\'),
    'Name cannot include dots or slashes'
  ),
});

export const moveFileSchema = z.object({
  fileId: z.uuidv4(),
  targetFolderId: z.optional(z.uuidv4()),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
export type RenameFileInput = z.infer<typeof renameFileSchema>;
export type MoveFileInput = z.infer<typeof moveFileSchema>;
