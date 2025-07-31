import redis from '@/lib/redis/redis';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { RedisKeys } from '@/lib/redis/redisKeys';
import { authConfig } from '@/features/auth/auth.config';
import * as otpService from '@/features/auth/services/otp.service';
import * as otpUtil from '@/features/auth/utils/otp.util';
import * as tokenUtil from '@/features/auth/utils/token.util';
import * as emailService from '@/lib/email/email.service';
import { tokenExpirations } from '@/constants/token.constants';

vi.mock('@/features/auth/utils/token.util');

const mockOtp = '123456';
const mockHashed = 'hashed123';
const userId = 'user-1';

beforeEach(() => {
  vi.clearAllMocks();
  (tokenUtil.hashTokenSync as any).mockReturnValue(mockHashed);
});

describe('sendOtp', () => {
  it('should generate, set, and send OTP', async () => {
    const setOtpSpy = vi.spyOn(otpUtil, 'setOtp').mockResolvedValueOnce();
    const sendEmailSpy = vi
      .spyOn(emailService, 'sendOtpEmail')
      .mockResolvedValueOnce();

    await otpService.sendOtp(userId, 'test@example.com');

    expect(setOtpSpy).toHaveBeenCalled();
    expect(sendEmailSpy).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringMatching(/^\d{6}$/)
    );
  });
});

describe('verifyOtp', () => {
  const redisSet = vi.spyOn(redis, 'set');
  const redisDel = vi.spyOn(redis, 'del');

  it('should throw if OTP does not exist', async () => {
    vi.spyOn(otpUtil, 'getOtp').mockResolvedValueOnce(null);

    await expect(otpService.verifyOtp(userId, mockOtp)).rejects.toThrow(
      'OTP expired or invalid'
    );
  });

  it('should throw if attempts exceed max', async () => {
    const data = {
      code: mockHashed,
      attempts: authConfig.OTP_MAX_ATTEMPTS,
      createdAt: Date.now(),
    };
    vi.spyOn(otpUtil, 'getOtp').mockResolvedValueOnce(data);

    await expect(otpService.verifyOtp(userId, mockOtp)).rejects.toThrow(
      'Maximum OTP attempts exceeded'
    );
    expect(redisDel).toHaveBeenCalled();
  });

  it('should throw and increment attempts on wrong OTP', async () => {
    const data = {
      code: 'wrongHash',
      attempts: 1,
      createdAt: Date.now(),
    };
    vi.spyOn(otpUtil, 'getOtp').mockResolvedValueOnce(data);

    await expect(otpService.verifyOtp(userId, 'wrong')).rejects.toThrow(
      'Incorrect OTP'
    );

    expect(redisSet).toHaveBeenCalledWith(
      RedisKeys.auth.otp(userId),
      expect.stringContaining('"attempts":2'),
      'EX',
      Math.floor(tokenExpirations.OTP_TOKEN_EXPIRY_MS / 1000)
    );
  });

  it('should delete OTP on correct code', async () => {
    const data = {
      code: mockHashed,
      attempts: 0,
      createdAt: Date.now(),
    };
    vi.spyOn(otpUtil, 'getOtp').mockResolvedValueOnce(data);
    (tokenUtil.hashTokenSync as any).mockReturnValue(mockHashed);

    await otpService.verifyOtp(userId, mockOtp);
    expect(redisDel).toHaveBeenCalledWith(RedisKeys.auth.otp(userId));
  });
});
