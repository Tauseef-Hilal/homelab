import { z } from 'zod';

export const signupSchema = z.object({
  username: z.string().min(1, 'Username must be at least 1 character'),
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const changePasswordSchema = z.object({
  token: z.string().min(1, 'Missing Token'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const requestChangePasswordSchema = z.object({
  email: z.email(),
});

export const verifyOtpSchema = z.object({
  token: z.string(),
  otp: z.string().min(6),
});

export const logoutSchema = z.object({
  logoutAll: z.optional(z.boolean())
})

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type RequestChangePasswordInput = z.infer<
  typeof requestChangePasswordSchema
>;
