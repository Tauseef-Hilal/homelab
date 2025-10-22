import { z } from 'zod';

export const uploadFileSchema = z.object({
  file: z.object({
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
  job: z.object({
    id: z.string(),
  }),
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
      })
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
      })
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

export type UploadFileResponse = z.infer<typeof uploadFileSchema>;
export type ListDirectoryResponse = z.infer<typeof listDirectorySchema>;
export type CreateFolderResponse = z.infer<typeof createFolderSchema>;
export type CopyItemsOutput = z.infer<typeof copyItemsSchema>;
export type MoveItemsOutput = z.infer<typeof moveItemsSchema>;
export type DeleteItemsOutput = z.infer<typeof deleteItemsSchema>;
export type DownloadItemsOutput = z.infer<typeof downloadItemsSchema>;
