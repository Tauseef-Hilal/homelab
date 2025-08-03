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
const error_middleware_1 = require("@/middleware/error.middleware");
const redisKeys_1 = require("@/lib/redis/redisKeys");
const auth_config_1 = require("@/features/auth/auth.config");
const TfaPurpose_1 = require("@/features/auth/constants/TfaPurpose");
const AuthService = __importStar(require("@/features/auth/services/auth.service"));
const OtpService = __importStar(require("@/features/auth/services/otp.service"));
const jwtUtils = __importStar(require("@/lib/jwt"));
const requestChangePassword_controller_1 = require("@/features/auth/controllers/requestChangePassword.controller");
(0, vitest_1.describe)('requestChangePasswordController', () => {
    const mockToken = 'tfa-token';
    let req;
    let res;
    let next;
    (0, vitest_1.beforeEach)(() => {
        req = {
            user: {
                id: 'user-123',
                email: 'user@example.com',
            },
        };
        res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        next = vitest_1.vi.fn().mockImplementation((err) => {
            (0, error_middleware_1.errorHandler)(err, req, res, next);
        });
        vitest_1.vi.spyOn(AuthService, 'allowPasswordChange').mockResolvedValue();
        vitest_1.vi.spyOn(OtpService, 'sendOtp').mockResolvedValue();
        vitest_1.vi.spyOn(redis_1.default, 'set').mockResolvedValue('OK');
        vitest_1.vi.spyOn(jwtUtils, 'generateTfaToken').mockReturnValue(mockToken);
    });
    const cases = [
        {
            expiresAt: String(Date.now() - 10000),
            label: 'previous OTP expired',
        },
        { expiresAt: null, label: 'no OTP sent previously' },
    ];
    vitest_1.it.each(cases)('should send OTP if $label', async ({ expiresAt }) => {
        vitest_1.vi.spyOn(redis_1.default, 'get').mockResolvedValue(expiresAt);
        await (0, requestChangePassword_controller_1.requestChangePasswordController)(req, res, next);
        (0, vitest_1.expect)(OtpService.sendOtp).toHaveBeenCalledWith(req.user.id, req.user.email);
        (0, vitest_1.expect)(redis_1.default.set).toHaveBeenCalledWith(redisKeys_1.RedisKeys.auth.allowPasswordChange(req.user.id), vitest_1.expect.any(String), 'EX', auth_config_1.authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS);
        (0, vitest_1.expect)(jwtUtils.generateTfaToken).toHaveBeenCalledWith({
            userId: req.user.id,
            purpose: TfaPurpose_1.TfaPurpose.CHANGE_PASSWORD,
            createdAt: vitest_1.expect.any(Number),
        });
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            success: true,
            token: mockToken,
        });
    });
    (0, vitest_1.it)('should not resend OTP if previous OTP has not expired', async () => {
        vitest_1.vi.spyOn(redis_1.default, 'get').mockResolvedValue(String(Date.now() + 10000));
        await (0, requestChangePassword_controller_1.requestChangePasswordController)(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'OTP already sent',
        });
    });
});
