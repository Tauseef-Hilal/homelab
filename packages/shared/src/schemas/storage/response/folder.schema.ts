import z from 'zod';

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
        parentId: z.union([z.string(), z.null()]),
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
    parentId: z.union([z.string(), z.null()]),
  }),
});

export type ListDirectoryResponse = z.infer<typeof listDirectorySchema>;
export type CreateFolderResponse = z.infer<typeof createFolderSchema>;
