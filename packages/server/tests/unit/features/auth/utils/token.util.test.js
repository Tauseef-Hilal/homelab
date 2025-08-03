"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_util_1 = require("@/features/auth/utils/token.util");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('hashTokenSync', () => {
    (0, vitest_1.it)('should return the same hash for the same input', () => {
        const token = 'my-secret-token';
        const hash1 = (0, token_util_1.hashTokenSync)(token);
        const hash2 = (0, token_util_1.hashTokenSync)(token);
        (0, vitest_1.expect)(hash1).toBe(hash2);
    });
    (0, vitest_1.it)('should return different hashes for different inputs', () => {
        const hash1 = (0, token_util_1.hashTokenSync)('token1');
        const hash2 = (0, token_util_1.hashTokenSync)('token2');
        (0, vitest_1.expect)(hash1).not.toBe(hash2);
    });
    (0, vitest_1.it)('should match the expected sha256 hash', () => {
        const token = 'test123';
        const expected = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        const actual = (0, token_util_1.hashTokenSync)(token);
        (0, vitest_1.expect)(actual).toBe(expected);
    });
});
(0, vitest_1.describe)('buildTokenPayload', () => {
    (0, vitest_1.it)('should build a valid JWT payload from user data', () => {
        const user = {
            id: 'user-123',
            email: 'test@example.com',
            role: client_1.UserRole.USER,
        };
        const payload = (0, token_util_1.buildTokenPayload)(user);
        (0, vitest_1.expect)(payload.sub).toBe(user.id);
        (0, vitest_1.expect)(payload.email).toBe(user.email);
        (0, vitest_1.expect)(payload.role).toBe(user.role);
        (0, vitest_1.expect)(typeof payload.iat).toBe('number');
    });
    (0, vitest_1.it)('should set "iat" close to current time', () => {
        const user = {
            id: 'user-456',
            email: 'now@example.com',
            role: client_1.UserRole.ADMIN,
        };
        const now = Math.floor(Date.now() / 1000);
        const payload = (0, token_util_1.buildTokenPayload)(user);
        (0, vitest_1.expect)(payload.iat).toBeGreaterThanOrEqual(now - 1);
        (0, vitest_1.expect)(payload.iat).toBeLessThanOrEqual(now + 1);
    });
});
