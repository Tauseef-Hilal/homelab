import z from 'zod';

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

export type UploadFileResponse = z.infer<typeof uploadFileSchema>;
