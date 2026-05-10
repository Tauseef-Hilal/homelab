import z from 'zod';

export const shareLinkSchema = z.object({
  token: z.string(),
});

export const getUserSharesSchema = z.object({
  shares: z.array(
    z.object({
      id: z.uuid(),
      permissions: z.int(),
      createdAt: z.string(),
      updatedAt: z.string(),
      user: z.object({
        username: z.string(),
        email: z.email(),
      }),
    }),
  ),
});

export const getSharedLinksSchema = z.object({
  links: z.array(
    z.object({
      id: z.uuid(),
      permissions: z.int(),
      createdAt: z.string(),
      expiresAt: z.nullable(z.string()),
      token: z.string(),
    }),
  ),
});

export type ShareLinkOutput = z.infer<typeof shareLinkSchema>;
export type GetSharedLinksOutput = z.infer<typeof getSharedLinksSchema>;
export type GetUserSharesOutput = z.infer<typeof getUserSharesSchema>;
