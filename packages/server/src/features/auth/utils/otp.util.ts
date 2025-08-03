import redis from '@shared/redis';
import { OtpPayload } from '../types/otp.types';
import { RedisKeys } from '@shared/redis/redisKeys';
import { hashTokenSync } from '../utils/token.util';
import { tokenExpirations } from '@server/constants/token.constants';

export const generateOtp = (): string => {
  const otp = Math.floor(100_000 + Math.random() * 900_000);
  return otp.toString();
};

export const setOtp = async (
  userId: string,
  code: string,
  expiresIn = tokenExpirations.OTP_TOKEN_EXPIRY_MS
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
    Math.floor(expiresIn / 1000)
  );
};

export const getOtp = async (userId: string): Promise<OtpPayload | null> => {
  const data = await redis.get(RedisKeys.auth.otp(userId));
  return data ? JSON.parse(data) : null;
};

export const deleteOtp = async (userId: string) => {
  return await redis.del(RedisKeys.auth.otp(userId));
};
