import redis from '@/lib/redis/redis';
import { OtpPayload } from '../types/otp.types';
import { authConfig } from '../auth.config';
import { RedisKeys } from '@/lib/redis/redisKeys';
import { hashTokenSync } from '../utils/token.util';

export const generateOtp = (): string => {
  const otp = Math.floor(100_000 + Math.random() * 900_000);
  return otp.toString();
};

export const setOtp = async (
  userId: string,
  code: string,
  expiresIn = authConfig.OTP_EXPIRY_SECONDS
) => {
  const payload: OtpPayload = {
    code: hashTokenSync(code),
    attempts: 0,
    createdAt: Date.now(),
  };
  await redis.set(
    RedisKeys.auth.otp(userId),
    JSON.stringify(payload),
    'EX',
    expiresIn
  );
};

export const getOtp = async (userId: string): Promise<OtpPayload | null> => {
  const data = await redis.get(RedisKeys.auth.otp(userId));
  return data ? JSON.parse(data) : null;
};

export const deleteOtp = async (userId: string) => {
  return await redis.del(RedisKeys.auth.otp(userId));
};
