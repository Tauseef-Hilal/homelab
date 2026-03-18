import { z } from 'zod';

export const copyItemsSchema = z.object({
  destinationFolderId: z.uuidv4(),
  items: z.array(
    z.object({ type: z.enum(['folder', 'file']), id: z.uuidv4() }),
  ),
});

export const moveItemsSchema = z.object({
  destinationFolderId: z.uuidv4(),
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
            (name) => !name.includes('/') && !name.includes('\\'),
            'Name cannot include slashes',
          ),
      ),
    }),
  ),
});

export const deleteItemsSchema = z.object({
  items: z.array(
    z.object({ id: z.uuidv4(), type: z.enum(['folder', 'file']) }),
  ),
});

export const downloadItemsSchema = z.object({
  items: z.array(
    z.object({ id: z.uuidv4(), type: z.enum(['folder', 'file']) }),
  ),
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

export const uploadInitSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().min(1),
  folderId: z.uuid(),
  totalSize: z.number(),
  totalChunks: z.number(),
});

export const uploadChunkCheckSchema = z.object({
  fileId: z.uuid(),
  uploadId: z.uuid(),
  chunks: z.array(
    z.object({
      index: z.number(),
      size: z.number(),
      hash: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  ),
});

export const uploadChunkHeaderSchema = z.object({
  'upload-id': z.uuid(),
  'file-id': z.uuid(),
  'chunk-index': z.coerce.number(),
  'chunk-hash': z.string().regex(/^[a-f0-9]{64}$/),
});

export const uploadFinishSchema = z.object({
  uploadId: z.uuid(),
});

export const uploadStatusSchema = z.object({
  uploadId: z.uuid(),
});

export const uploadCancelSchema = z.object({
  uploadId: z.uuid(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type ListDirectoryInput = z.infer<typeof listDirectorySchema>;
export type CopyItemsInput = z.infer<typeof copyItemsSchema>;
export type MoveItemsInput = z.infer<typeof moveItemsSchema>;
export type DeleteItemsInput = z.infer<typeof deleteItemsSchema>;
export type DownloadItemsInput = z.infer<typeof downloadItemsSchema>;
export type UploadInitInput = z.infer<typeof uploadInitSchema>;
export type UploadChunkCheckInput = z.infer<typeof uploadChunkCheckSchema>;
export type UploadChunkHeaderInput = z.infer<typeof uploadChunkHeaderSchema>;
export type UploadFinishInput = z.infer<typeof uploadFinishSchema>;
export type UploadCancelInput = z.infer<typeof uploadCancelSchema>;
export type UploadStatusInput = z.infer<typeof uploadStatusSchema>;
