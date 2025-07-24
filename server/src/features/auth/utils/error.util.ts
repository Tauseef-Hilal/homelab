import { HttpError } from "@/errors/HttpError";
import { CommonErrorCode } from "@/errors/CommonErrorCode";
import { AuthErrorCode } from "../constants/AuthErrorCode";

export function throwInvalidToken() {
  throw new HttpError({
    status: 401,
    code: AuthErrorCode.INVALID_TOKEN,
    message: 'Invalid token provided',
  });
}

export function throwExpiredToken() {
  throw new HttpError({
    status: 401,
    code: AuthErrorCode.TOKEN_EXPIRED,
    message: 'Token expired',
  });
}

export function throwTokenReused() {
  throw new HttpError({
    status: 401,
    code: AuthErrorCode.TOKEN_REUSED,
    message: 'Suspicious token activity detected',
  });
}

export function throwUnauthorized(message?: string) {
  throw new HttpError({
    status: 401,
    code: CommonErrorCode.UNAUTHORIZED,
    message: message ?? 'Access token is missing or invalid',
  });
}
