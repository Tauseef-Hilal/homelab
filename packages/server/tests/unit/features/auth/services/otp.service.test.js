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
const auth_config_1 = require("@/features/auth/auth.config");
const otpService = __importStar(require("@/features/auth/services/otp.service"));
const otpUtil = __importStar(require("@/features/auth/utils/otp.util"));
const tokenUtil = __importStar(require("@/features/auth/utils/token.util"));
const emailService = __importStar(require("@/lib/email/email.service"));
const token_constants_1 = require("@/constants/token.constants");
vitest_1.vi.mock('@/features/auth/utils/token.util');
const mockOtp = '123456';
const mockHashed = 'hashed123';
const userId = 'user-1';
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    tokenUtil.hashTokenSync.mockReturnValue(mockHashed);
});
(0, vitest_1.describe)('sendOtp', () => {
    (0, vitest_1.it)('should generate, set, and send OTP', async () => {
        const setOtpSpy = vitest_1.vi.spyOn(otpUtil, 'setOtp').mockResolvedValueOnce();
        const sendEmailSpy = vitest_1.vi
            .spyOn(emailService, 'sendOtpEmail')
            .mockResolvedValueOnce();
        await otpService.sendOtp(userId, 'test@example.com');
        (0, vitest_1.expect)(setOtpSpy).toHaveBeenCalled();
        (0, vitest_1.expect)(sendEmailSpy).toHaveBeenCalledWith('test@example.com', vitest_1.expect.stringMatching(/^\d{6}$/));
    });
});
(0, vitest_1.describe)('verifyOtp', () => {
    const redisSet = vitest_1.vi.spyOn(redis_1.default, 'set');
    const redisDel = vitest_1.vi.spyOn(redis_1.default, 'del');
    (0, vitest_1.it)('should throw if OTP does not exist', async () => {
        vitest_1.vi.spyOn(otpUtil, 'getOtp').mockResolvedValueOnce(null);
        await (0, vitest_1.expect)(otpService.verifyOtp(userId, mockOtp)).rejects.toThrow('OTP expired or invalid');
    });
    (0, vitest_1.it)('should throw if attempts exceed max', async () => {
        const data = {
            code: mockHashed,
            attempts: auth_config_1.authConfig.OTP_MAX_ATTEMPTS,
            createdAt: Date.now(),
        };
        vitest_1.vi.spyOn(otpUtil, 'getOtp').mockResolvedValueOnce(data);
        await (0, vitest_1.expect)(otpService.verifyOtp(userId, mockOtp)).rejects.toThrow('Maximum OTP attempts exceeded');
        (0, vitest_1.expect)(redisDel).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should throw and increment attempts on wrong OTP', async () => {
        const data = {
            code: 'wrongHash',
            attempts: 1,
            createdAt: Date.now(),
        };
        vitest_1.vi.spyOn(otpUtil, 'getOtp').mockResolvedValueOnce(data);
        await (0, vitest_1.expect)(otpService.verifyOtp(userId, 'wrong')).rejects.toThrow('Incorrect OTP');
        (0, vitest_1.expect)(redisSet).toHaveBeenCalledWith(redisKeys_1.RedisKeys.auth.otp(userId), vitest_1.expect.stringContaining('"attempts":2'), 'EX', Math.floor(token_constants_1.tokenExpirations.OTP_TOKEN_EXPIRY_MS / 1000));
    });
    (0, vitest_1.it)('should delete OTP on correct code', async () => {
        const data = {
            code: mockHashed,
            attempts: 0,
            createdAt: Date.now(),
        };
        vitest_1.vi.spyOn(otpUtil, 'getOtp').mockResolvedValueOnce(data);
        tokenUtil.hashTokenSync.mockReturnValue(mockHashed);
        await otpService.verifyOtp(userId, mockOtp);
        (0, vitest_1.expect)(redisDel).toHaveBeenCalledWith(redisKeys_1.RedisKeys.auth.otp(userId));
    });
});
