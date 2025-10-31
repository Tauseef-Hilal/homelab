import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTfaToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyTfaToken,
} from '@server/lib/jwt';
import { JwtPayload, TfaPayload } from '@server/types/jwt.types';
import { UserRole } from '@prisma/client';
import { TfaPurpose } from '@server/features/auth/constants/TfaPurpose';

describe('JWT utilities', () => {
  const accessTokenPayload: JwtPayload = {
    sub: 'abc123',
    email: 'abc@gmail.com',
    role: UserRole.ADMIN,
    iat: Date.now(),
  };
  const refreshTokenPayload = accessTokenPayload;
  const tfaTokenPayload: TfaPayload = {
    userId: 'abc123',
    email: 'abc@gmail.com',
    purpose: TfaPurpose.CHANGE_PASSWORD,
    createdAt: Date.now(),
  };

  it('should generate a valid access token', () => {
    const token = generateAccessToken(accessTokenPayload);
    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid access token', () => {
    const token = generateAccessToken(accessTokenPayload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('abc123');
  });

  it('should throw error for invalid access token', () => {
    expect(() => verifyAccessToken('invalid.token')).toThrow();
  });

  it('should generate a valid refresh token', () => {
    const token = generateRefreshToken(refreshTokenPayload);
    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid refresh token', () => {
    const token = generateRefreshToken(refreshTokenPayload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe('abc123');
  });

  it('should throw error for invalid refresh token', () => {
    expect(() => verifyRefreshToken('invalid.token')).toThrow();
  });

  it('should generate a valid tfa token', () => {
    const token = generateTfaToken(tfaTokenPayload);
    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid tfa token', () => {
    const token = generateTfaToken(tfaTokenPayload);
    const decoded = verifyTfaToken(token);
    expect(decoded.userId).toBe('abc123');
  });

  it('should throw error for invalid tfa token', () => {
    expect(() => verifyTfaToken('invalid.token')).toThrow();
  });
});
