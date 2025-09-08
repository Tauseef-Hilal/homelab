import { z } from 'zod';

export const loginSchema = z.object({
  token: z.string(),
});

export const signupSchema = z.object({
  user: z.object({
    id: z.uuidv4(),
    username: z.string(),
    email: z.email(),
    role: z.enum(['USER', 'ADMIN']),
  }),
  tokens: z.object({
    access: z.string(),
  }),
});

export const verifyOtpSchema = z.object({
  user: z.optional(
    z.object({
      id: z.uuidv4(),
      username: z.string(),
      email: z.email(),
      role: z.enum(['USER', 'ADMIN']),
    })
  ),
  tokens: z.optional(
    z.object({
      access: z.string().min(1),
    })
  ),
  changePasswordToken: z.optional(z.string().min(1)),
});

export const requestChangePasswordSchema = z.object({
  token: z.string().min(1),
});

export const changePasswordSchema = z.object({});

export const logoutSchema = z.object({});

export type LoginResponse = z.infer<typeof loginSchema>;
export type SignupResponse = z.infer<typeof signupSchema>;
export type VerifyOtpResponse = z.infer<typeof verifyOtpSchema>;
export type RequestChangePasswordResponse = z.infer<
  typeof requestChangePasswordSchema
>;
export type ChangePasswordResponse = z.infer<typeof changePasswordSchema>;
export type LogoutResponse = z.infer<typeof logoutSchema>;
