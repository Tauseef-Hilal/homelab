import { z } from 'zod';

export const signupSchema = z.object({
  username: z.string(),
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const changePasswordSchema = z.object({
  email: z.email(),
  oldPassword: z.string().min(8, 'Password must be at least 8 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const requestChangePasswordSchema = z.object({
  email: z.email(),
});

export const verifyOtpSchema = z.object({
  token: z.string(),
  otp: z.string().min(6),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RequestChangePasswordInput = z.infer<
  typeof requestChangePasswordSchema
>;
