"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jwt_1 = require("@/lib/jwt");
const client_1 = require("@prisma/client");
const TfaPurpose_1 = require("@/features/auth/constants/TfaPurpose");
(0, vitest_1.describe)('JWT utilities', () => {
    const accessTokenPayload = {
        sub: 'abc123',
        email: 'abc@gmail.com',
        role: client_1.UserRole.ADMIN,
        iat: Date.now(),
    };
    const refreshTokenPayload = accessTokenPayload;
    const tfaTokenPayload = {
        userId: 'abc123',
        purpose: TfaPurpose_1.TfaPurpose.CHANGE_PASSWORD,
        createdAt: Date.now(),
    };
    (0, vitest_1.it)('should generate a valid access token', () => {
        const token = (0, jwt_1.generateAccessToken)(accessTokenPayload);
        (0, vitest_1.expect)(token).toBeTypeOf('string');
        (0, vitest_1.expect)(token.split('.')).toHaveLength(3);
    });
    (0, vitest_1.it)('should verify a valid access token', () => {
        const token = (0, jwt_1.generateAccessToken)(accessTokenPayload);
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        (0, vitest_1.expect)(decoded.sub).toBe('abc123');
    });
    (0, vitest_1.it)('should throw error for invalid access token', () => {
        (0, vitest_1.expect)(() => (0, jwt_1.verifyAccessToken)('invalid.token')).toThrow();
    });
    (0, vitest_1.it)('should generate a valid refresh token', () => {
        const token = (0, jwt_1.generateRefreshToken)(refreshTokenPayload);
        (0, vitest_1.expect)(token).toBeTypeOf('string');
        (0, vitest_1.expect)(token.split('.')).toHaveLength(3);
    });
    (0, vitest_1.it)('should verify a valid refresh token', () => {
        const token = (0, jwt_1.generateRefreshToken)(refreshTokenPayload);
        const decoded = (0, jwt_1.verifyRefreshToken)(token);
        (0, vitest_1.expect)(decoded.sub).toBe('abc123');
    });
    (0, vitest_1.it)('should throw error for invalid refresh token', () => {
        (0, vitest_1.expect)(() => (0, jwt_1.verifyRefreshToken)('invalid.token')).toThrow();
    });
    (0, vitest_1.it)('should generate a valid tfa token', () => {
        const token = (0, jwt_1.generateTfaToken)(tfaTokenPayload);
        (0, vitest_1.expect)(token).toBeTypeOf('string');
        (0, vitest_1.expect)(token.split('.')).toHaveLength(3);
    });
    (0, vitest_1.it)('should verify a valid tfa token', () => {
        const token = (0, jwt_1.generateTfaToken)(tfaTokenPayload);
        const decoded = (0, jwt_1.verifyTfaToken)(token);
        (0, vitest_1.expect)(decoded.userId).toBe('abc123');
    });
    (0, vitest_1.it)('should throw error for invalid tfa token', () => {
        (0, vitest_1.expect)(() => (0, jwt_1.verifyTfaToken)('invalid.token')).toThrow();
    });
});
