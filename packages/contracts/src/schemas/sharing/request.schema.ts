import z from 'zod';

export const shareWithUserSchema = z.object({
  userEmail: z.email('Invalid email address'),
  permissions: z.int().nonnegative(),
});

export const revokeUserShareSchema = z.object({
  userEmail: z.email('Invalid email address'),
});

export const updateUserShareSchema = z.object({
  userEmail: z.email('Invalid email address'),
  permissions: z.int().nonnegative(),
});

export const shareLinkSchema = z.object({
  permissions: z.int().nonnegative(),
  expiry: z.nullable(z.number().refine((val) => val > Date.now(), {
    message: 'Expiry must be a date in the future',
  })),
});

export const revokeSharedLinkSchema = z.object({
  token: z.string(),
});

export const updateLinkSchema = z.object({
  permissions: z.int().nonnegative(),
  expiry: z.nullable(z.number().refine((val) => val > Date.now(), {
    message: 'Expiry must be a date in the future',
  })),
});

export type ShareWithUserInput = z.infer<typeof shareWithUserSchema>;
export type RevokeUserShareInput = z.infer<typeof revokeUserShareSchema>;
export type UpdateUserShareInput = z.infer<typeof updateUserShareSchema>;
export type ShareLinkInput = z.infer<typeof shareLinkSchema>;
export type RevokeSharedLinkInput = z.infer<typeof revokeSharedLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
