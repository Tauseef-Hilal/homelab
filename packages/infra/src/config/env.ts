import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

const envName = process.env.NODE_ENV ?? 'development';
const envPath = path.resolve(__dirname, `../../../../.env.${envName}`);

dotenv.config({
  path: envPath,
  quiet: true,
});

const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(['test', 'development', 'production']),
  CLIENT_URL: z.url(),
  API_BASE_URL: z.url(),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'ACCESS_TOKEN_SECRET is required'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
  TFA_TOKEN_SECRET: z.string().min(1, 'TFA_TOKEN_SECRET is required'),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_EMAIL_FROM: z.email(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  REDIS_PASSWORD: z.string(),
  ADMIN_PASSWORD: z.string(),
  STORAGE_PROVIDER: z.string(),
  ROOT_DIR_PATH: z.string().min(1),
  LOG_DIR_PATH: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    `Invalid environment variables in ${envPath}:`,
    z.treeifyError(parsed.error),
  );
  throw new Error('Environment validation failed');
}

export const env = parsed.data;
