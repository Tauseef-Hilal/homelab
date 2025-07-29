import bcrypt from 'bcrypt';
import { describe, expect, it } from 'vitest';
import { hashPassword, isValidPassword } from '@/lib/bcrypt';

describe('hashPassword', () => {
  it('should return a hashed version of the input password', async () => {
    const rawPassword = 'MySecureP@ss123';
    const hashed = await hashPassword(rawPassword);

    // The hash should not match raw password
    expect(hashed).not.toBe(rawPassword);

    // The hash should validate against original password
    const isValid = await bcrypt.compare(rawPassword, hashed);
    expect(isValid).toBe(true);
  });

  it('should generate a different hash each time (due to random salt)', async () => {
    const rawPassword = 'RepeatMe123!';
    const hash1 = await hashPassword(rawPassword);
    const hash2 = await hashPassword(rawPassword);

    expect(hash1).not.toBe(hash2);
  });
});

describe('isValidPassword', async () => {
  const password = 'secret-123';
  const hashedPassword = await hashPassword(password);

  it('returns true if the given password is correct', async () => {
    expect(await isValidPassword(password, hashedPassword)).toBe(true);
  });

  it('returns false if the given password is incorrect', async () => {
    expect(await isValidPassword('wrong-pswd', hashedPassword)).toBe(false);
  });
});
