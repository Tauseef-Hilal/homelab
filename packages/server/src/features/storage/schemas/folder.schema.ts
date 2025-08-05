import z from 'zod';

export const createFolderSchema = z.object({
  folderName: z.string().min(1, "Folder name can't be empty"),
  parentId: z.nullable(z.uuidv4()),
});

export const moveFolderSchema = z
  .object({
    targetFolderId: z.optional(z.nullable(z.uuidv4())),
    newFolderName: z.optional(
      z
        .string()
        .min(1, "Folder name can't be empty")
        .max(255, 'Name too long')
        .refine(
          (name) =>
            !name.includes('.') && !name.includes('/') && !name.includes('\\'),
          'Name cannot include dots or slashes'
        )
    ),
  })
  .refine(
    (data) =>
      data.targetFolderId !== undefined || data.newFolderName !== undefined,
    {
      message: 'Either targetFolderId or newFolderName must be provided',
      path: [], // applies to the whole object
    }
  );

export const copyFolderSchema = z.object({
  targetFolderId: z.nullable(z.uuidv4()),
});

export const idParamSchema = z.uuidv4();

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;
export type CopyFolderInput = z.infer<typeof copyFolderSchema>;
