import redis from '@/lib/redis/redis';
import { OtpPayload } from '../types/otp.types';
import { authConfig } from '../auth.config';
import { throwUnauthorized } from '../utils/error.util';
import { RedisKeys } from '@/lib/redis/redisKeys';
import { hashTokenSync } from '../utils/token.util';
import { TfaPurpose } from '../constants/TfaPurpose';
import { generateTfaToken } from '../utils/jwt.util';
import { sendOtpEmail } from '@/lib/email/service';

export const generateOtp = () => {
  return Math.trunc(Math.random() * 10 ** 6);
};

export const sendOtp = async (userId: string, email: string) => {
  const otp = String(generateOtp());

  await setOtp(userId, otp);
  await sendOtpEmail(email, otp);
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

export const verifyOtp = async (
  userId: string,
  inputCode: string
): Promise<void> => {
  const data = await getOtp(userId);
  if (!data) return throwUnauthorized('OTP expired or not found');

  const { code, attempts } = data;

  if (attempts >= authConfig.OTP_MAX_ATTEMPTS) {
    await deleteOtp(userId);
    return throwUnauthorized('Maximum OTP attempts exceeded');
  }

  const hashedInput = hashTokenSync(inputCode);

  if (hashedInput !== code) {
    data.attempts += 1;
    await redis.set(
      RedisKeys.auth.otp(userId),
      JSON.stringify(data),
      'EX',
      authConfig.OTP_EXPIRY_SECONDS
    );

    return throwUnauthorized('Incorrect OTP');
  }

  await deleteOtp(userId);
};
