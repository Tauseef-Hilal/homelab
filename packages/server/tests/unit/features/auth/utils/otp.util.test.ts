import redis from '@shared/redis';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisKeys } from '@shared/redis/redisKeys';
import { authConfig } from '@server/features/auth/auth.config';
import * as otpUtil from '@server/features/auth/utils/otp.util';
import * as tokenUtil from '@server/features/auth/utils/token.util';
import { tokenExpirations } from '@server/constants/token.constants';

vi.mock('@server/features/auth/utils/token.util');

const mockOtp = '123456';
const mockHashed = 'hashed123';
const userId = 'user-1';

beforeEach(() => {
  vi.clearAllMocks();
  (tokenUtil.hashTokenSync as any).mockReturnValue(mockHashed);
});

describe('generateOtp', () => {
  it('should return a 6-digit number as string', () => {
    const otp = otpUtil.generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });
});

describe('setOtp', () => {
  it('should store OTP data in redis with expiry', async () => {
    const spy = vi.spyOn(redis, 'set');

    await otpUtil.setOtp(userId, mockOtp);

    expect(spy).toHaveBeenCalledWith(
      RedisKeys.auth.otp(userId),
      expect.stringContaining(mockHashed),
      'EX',
      Math.floor(tokenExpirations.OTP_TOKEN_EXPIRY_MS / 1000)
    );
  });
});

describe('getOtp', () => {
  it('should return parsed OTP payload from redis', async () => {
    const payload = {
      code: mockHashed,
      attempts: 1,
      createdAt: Date.now(),
    };
    vi.spyOn(redis, 'get').mockResolvedValueOnce(JSON.stringify(payload));

    const result = await otpUtil.getOtp(userId);
    expect(result).toEqual(payload);
  });

  it('should return null if no OTP exists', async () => {
    vi.spyOn(redis, 'get').mockResolvedValueOnce(null);

    const result = await otpUtil.getOtp(userId);
    expect(result).toBeNull();
  });
});

describe('deleteOtp', () => {
  it('should call redis.del with correct key', async () => {
    const spy = vi.spyOn(redis, 'del');
    await otpUtil.deleteOtp(userId);
    expect(spy).toHaveBeenCalledWith(RedisKeys.auth.otp(userId));
  });
});
