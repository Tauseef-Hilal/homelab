"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("@/lib/redis/redis"));
const vitest_1 = require("vitest");
const redisKeys_1 = require("@/lib/redis/redisKeys");
const otpUtil = __importStar(require("@/features/auth/utils/otp.util"));
const tokenUtil = __importStar(require("@/features/auth/utils/token.util"));
const token_constants_1 = require("@/constants/token.constants");
vitest_1.vi.mock('@/features/auth/utils/token.util');
const mockOtp = '123456';
const mockHashed = 'hashed123';
const userId = 'user-1';
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    tokenUtil.hashTokenSync.mockReturnValue(mockHashed);
});
(0, vitest_1.describe)('generateOtp', () => {
    (0, vitest_1.it)('should return a 6-digit number as string', () => {
        const otp = otpUtil.generateOtp();
        (0, vitest_1.expect)(otp).toMatch(/^\d{6}$/);
    });
});
(0, vitest_1.describe)('setOtp', () => {
    (0, vitest_1.it)('should store OTP data in redis with expiry', async () => {
        const spy = vitest_1.vi.spyOn(redis_1.default, 'set');
        await otpUtil.setOtp(userId, mockOtp);
        (0, vitest_1.expect)(spy).toHaveBeenCalledWith(redisKeys_1.RedisKeys.auth.otp(userId), vitest_1.expect.stringContaining(mockHashed), 'EX', Math.floor(token_constants_1.tokenExpirations.OTP_TOKEN_EXPIRY_MS / 1000));
    });
});
(0, vitest_1.describe)('getOtp', () => {
    (0, vitest_1.it)('should return parsed OTP payload from redis', async () => {
        const payload = {
            code: mockHashed,
            attempts: 1,
            createdAt: Date.now(),
        };
        vitest_1.vi.spyOn(redis_1.default, 'get').mockResolvedValueOnce(JSON.stringify(payload));
        const result = await otpUtil.getOtp(userId);
        (0, vitest_1.expect)(result).toEqual(payload);
    });
    (0, vitest_1.it)('should return null if no OTP exists', async () => {
        vitest_1.vi.spyOn(redis_1.default, 'get').mockResolvedValueOnce(null);
        const result = await otpUtil.getOtp(userId);
        (0, vitest_1.expect)(result).toBeNull();
    });
});
(0, vitest_1.describe)('deleteOtp', () => {
    (0, vitest_1.it)('should call redis.del with correct key', async () => {
        const spy = vitest_1.vi.spyOn(redis_1.default, 'del');
        await otpUtil.deleteOtp(userId);
        (0, vitest_1.expect)(spy).toHaveBeenCalledWith(redisKeys_1.RedisKeys.auth.otp(userId));
    });
});
