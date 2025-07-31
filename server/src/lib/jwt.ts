import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { JwtPayload, TfaPayload } from '../types/jwt.types';
import { tokenExpirations } from '@/constants/token.constants';

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: tokenExpirations.ACCESS_TOKEN_EXPIRY_MS,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: tokenExpirations.REFRESH_TOKEN_EXPIRY_MS,
  } as jwt.SignOptions);
}

export function generateTfaToken(payload: TfaPayload): string {
  return jwt.sign(payload, env.TFA_TOKEN_SECRET, {
    expiresIn: tokenExpirations.OTP_TOKEN_EXPIRY_MS,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
}

export function verifyTfaToken(token: string): TfaPayload {
  return jwt.verify(token, env.TFA_TOKEN_SECRET) as TfaPayload;
}
