import { z } from 'zod';

export const getStatsSchema = z.object({
  storageUsed: z.number(),
  storageQuota: z.number(),
});

export const listDirectorySchema = z.object({
  folder: z.object({
    id: z.string(),
    name: z.string(),
    fullPath: z.string(),
    createdAt: z.string(),
    userId: z.string(),
    updatedAt: z.string(),
    parentId: z.union([z.string(), z.null()]),
    files: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        fullPath: z.string(),
        mimeType: z.string(),
        size: z.number(),
        visibility: z.enum(['private', 'public']),
        hasThumbnail: z.boolean(),
        userId: z.string(),
        updatedAt: z.string(),
        folderId: z.string(),
      }),
    ),
    children: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        fullPath: z.string(),
        createdAt: z.string(),
        userId: z.string(),
        updatedAt: z.string(),
        parentId: z.string(),
      }),
    ),
  }),
});

export const createFolderSchema = z.object({
  folder: z.object({
    id: z.string(),
    name: z.string(),
    fullPath: z.string(),
    createdAt: z.string(),
    userId: z.string(),
    updatedAt: z.string(),
    parentId: z.string(),
  }),
});

export const copyItemsSchema = z.object({
  job: z.object({
    id: z.uuidv4(),
  }),
});

export const moveItemsSchema = z.object({
  job: z.object({
    id: z.uuidv4(),
  }),
});

export const deleteItemsSchema = z.object({
  job: z.object({
    id: z.uuidv4(),
  }),
});

export const downloadItemsSchema = z.object({
  job: z.object({
    id: z.uuidv4(),
  }),
});

export const uploadInitSchema = z.object({
  fileId: z.uuid(),
  uploadId: z.uuid(),
});

export const uploadChunkCheckSchema = z.object({
  missingChunks: z.array(z.int()),
});

export const uploadStatusSchema = z.object({
  status: z.enum(['active', 'cancelled', 'completed', 'expired']),
  uploadedChunks: z.int(),
  totalChunks: z.int(),
});

export type GetStatsOutput = z.infer<typeof getStatsSchema>;
export type ListDirectoryResponse = z.infer<typeof listDirectorySchema>;
export type CreateFolderResponse = z.infer<typeof createFolderSchema>;
export type CopyItemsOutput = z.infer<typeof copyItemsSchema>;
export type MoveItemsOutput = z.infer<typeof moveItemsSchema>;
export type DeleteItemsOutput = z.infer<typeof deleteItemsSchema>;
export type DownloadItemsOutput = z.infer<typeof downloadItemsSchema>;
export type UploadInitOutput = z.infer<typeof uploadInitSchema>;
export type UploadChunkCheckOutput = z.infer<typeof uploadChunkCheckSchema>;
export type UploadStatusSchema = z.infer<typeof uploadStatusSchema>;
