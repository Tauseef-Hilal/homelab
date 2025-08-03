"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const vitest_1 = require("vitest");
const bcrypt_2 = require("@/lib/bcrypt");
(0, vitest_1.describe)('hashPassword', () => {
    (0, vitest_1.it)('should return a hashed version of the input password', async () => {
        const rawPassword = 'MySecureP@ss123';
        const hashed = await (0, bcrypt_2.hashPassword)(rawPassword);
        // The hash should not match raw password
        (0, vitest_1.expect)(hashed).not.toBe(rawPassword);
        // The hash should validate against original password
        const isValid = await bcrypt_1.default.compare(rawPassword, hashed);
        (0, vitest_1.expect)(isValid).toBe(true);
    });
    (0, vitest_1.it)('should generate a different hash each time (due to random salt)', async () => {
        const rawPassword = 'RepeatMe123!';
        const hash1 = await (0, bcrypt_2.hashPassword)(rawPassword);
        const hash2 = await (0, bcrypt_2.hashPassword)(rawPassword);
        (0, vitest_1.expect)(hash1).not.toBe(hash2);
    });
});
(0, vitest_1.describe)('isValidPassword', async () => {
    const password = 'secret-123';
    const hashedPassword = await (0, bcrypt_2.hashPassword)(password);
    (0, vitest_1.it)('returns true if the given password is correct', async () => {
        (0, vitest_1.expect)(await (0, bcrypt_2.isValidPassword)(password, hashedPassword)).toBe(true);
    });
    (0, vitest_1.it)('returns false if the given password is incorrect', async () => {
        (0, vitest_1.expect)(await (0, bcrypt_2.isValidPassword)('wrong-pswd', hashedPassword)).toBe(false);
    });
});
