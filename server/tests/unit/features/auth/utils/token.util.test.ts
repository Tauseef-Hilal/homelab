import { UserPayload } from '@/features/auth/types/user.types';
import {
  buildTokenPayload,
  hashTokenSync,
} from '@/features/auth/utils/token.util';
import { UserRole } from '@prisma/client';
import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';

describe('hashTokenSync', () => {
  it('should return the same hash for the same input', () => {
    const token = 'my-secret-token';
    const hash1 = hashTokenSync(token);
    const hash2 = hashTokenSync(token);
    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different inputs', () => {
    const hash1 = hashTokenSync('token1');
    const hash2 = hashTokenSync('token2');
    expect(hash1).not.toBe(hash2);
  });

  it('should match the expected sha256 hash', () => {
    const token = 'test123';
    const expected = createHash('sha256').update(token).digest('hex');
    const actual = hashTokenSync(token);
    expect(actual).toBe(expected);
  });
});

describe('buildTokenPayload', () => {
  it('should build a valid JWT payload from user data', () => {
    const user: UserPayload = {
      id: 'user-123',
      email: 'test@example.com',
      role: UserRole.USER,
    };

    const payload = buildTokenPayload(user);

    expect(payload.sub).toBe(user.id);
    expect(payload.email).toBe(user.email);
    expect(payload.role).toBe(user.role);
    expect(typeof payload.iat).toBe('number');
  });

  it('should set "iat" close to current time', () => {
    const user: UserPayload = {
      id: 'user-456',
      email: 'now@example.com',
      role: UserRole.ADMIN,
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = buildTokenPayload(user);
    expect(payload.iat).toBeGreaterThanOrEqual(now - 1);
    expect(payload.iat).toBeLessThanOrEqual(now + 1);
  });
});
