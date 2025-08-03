import redis from '@shared/redis';
import { authConfig } from '../auth.config';
import { throwUnauthorized } from '../utils/error.util';
import { RedisKeys } from '@shared/redis/redisKeys';
import { hashTokenSync } from '../utils/token.util';
import { sendOtpEmail } from '@server/lib/email/email.service';
import { deleteOtp, generateOtp, getOtp, setOtp } from '../utils/otp.util';
import { tokenExpirations } from '@server/constants/token.constants';

export const sendOtp = async (userId: string, email: string) => {
  const otp = generateOtp();

  await setOtp(userId, otp);
  await sendOtpEmail(email, otp);
};

export const verifyOtp = async (
  userId: string,
  inputCode: string
): Promise<void> => {
  const data = await getOtp(userId);
  if (!data) return throwUnauthorized('OTP expired or invalid');

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
      Math.floor(tokenExpirations.OTP_TOKEN_EXPIRY_MS / 1000)
    );

    return throwUnauthorized('Incorrect OTP');
  }

  await deleteOtp(userId);
};
