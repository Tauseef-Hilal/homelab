import { z } from 'zod';

export const copyItemsSchema = z.object({
  destinationFolderId: z.uuidv4(),
  items: z.array(
    z.object({ type: z.enum(['folder', 'file']), id: z.uuidv4() })
  ),
});

export const moveItemsSchema = z.object({
  destinationFolderId: z.optional(z.uuidv4()),
  items: z.array(
    z.object({
      type: z.enum(['folder', 'file']),
      id: z.uuidv4(),
      newName: z.optional(
        z
          .string()
          .min(1, "Folder name can't be empty")
          .max(255, 'Name too long')
          .refine(
            (name) =>
              !name.includes('.') &&
              !name.includes('/') &&
              !name.includes('\\'),
            'Name cannot include dots or slashes'
          )
      ),
    })
  ),
});

export const deleteItemsSchema = z.object({
  items: z.array(
    z.object({ id: z.uuidv4(), type: z.enum(['folder', 'file']) })
  ),
});

export const downloadItemsSchema = z.object({
  items: z.array(
    z.object({ id: z.uuidv4(), type: z.enum(['folder', 'file']) })
  ),
});

export const uploadFileSchema = z.object({
  folderId: z.uuidv4(),
  visibility: z.enum(['public', 'private', 'shared']),
});

export const previewFileQuerySchema = z.object({
  token: z.string().min(1),
});

export const createFolderSchema = z.object({
  folderName: z.string().min(1, "Folder name can't be empty"),
  parentId: z.nullable(z.uuidv4()),
});

export const idParamSchema = z.uuidv4();

export const listDirectorySchema = z.object({
  path: z.string(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type ListDirectoryInput = z.infer<typeof listDirectorySchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type CopyItemsInput = z.infer<typeof copyItemsSchema>;
export type MoveItemsInput = z.infer<typeof moveItemsSchema>;
export type DeleteItemsInput = z.infer<typeof deleteItemsSchema>;
export type DownloadItemsInput = z.infer<typeof downloadItemsSchema>;
