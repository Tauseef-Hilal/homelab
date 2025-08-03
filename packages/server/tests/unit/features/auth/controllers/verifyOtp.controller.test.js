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
const vitest_1 = require("vitest");
const logger_1 = __importDefault(require("@/lib/logger"));
const prisma_1 = require("@/lib/prisma");
const env_1 = require("@/config/env");
const HttpError_1 = require("@/errors/HttpError");
const CommonErrorCode_1 = require("@/errors/CommonErrorCode");
const error_middleware_1 = require("@/middleware/error.middleware");
const TfaPurpose_1 = require("@/features/auth/constants/TfaPurpose");
const AuthService = __importStar(require("@/features/auth/services/auth.service"));
const OtpService = __importStar(require("@/features/auth/services/otp.service"));
const JwtUtils = __importStar(require("@/lib/jwt"));
const TokenUtils = __importStar(require("@/features/auth/utils/token.util"));
const verifyOtp_controller_1 = require("@/features/auth/controllers/verifyOtp.controller");
const token_constants_1 = require("@/constants/token.constants");
vitest_1.vi.mock('@/lib/logger');
vitest_1.vi.mock('@/lib/prisma');
(0, vitest_1.describe)('verifyOtpController', () => {
    const mockOtp = '123456';
    const mockToken = 'tfa-token';
    const mockTokens = { access: 'access-token', refresh: 'refresh-token' };
    const mockTokenPayload = {
        userId: 'user-123',
        purpose: TfaPurpose_1.TfaPurpose.CHANGE_PASSWORD,
    };
    const mockUser = { id: 'user-123', email: 'user@example.com', role: 'USER' };
    let req;
    let res;
    let next;
    (0, vitest_1.beforeEach)(() => {
        req = {
            body: {
                token: mockToken,
                otp: mockOtp,
            },
            logger: logger_1.default,
            clientMeta: { ipAddress: '127.0.0.1', userAgent: 'Vitest' },
        };
        res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            cookie: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        next = vitest_1.vi.fn().mockImplementation((err) => {
            (0, error_middleware_1.errorHandler)(err, req, res, next);
        });
        vitest_1.vi.spyOn(AuthService, 'allowPasswordChange').mockResolvedValue();
    });
    (0, vitest_1.it)('should verify OTP and allow password change', async () => {
        vitest_1.vi.spyOn(OtpService, 'verifyOtp').mockResolvedValue();
        vitest_1.vi.spyOn(JwtUtils, 'verifyTfaToken').mockReturnValue(mockTokenPayload);
        await (0, verifyOtp_controller_1.verifyOtpController)(req, res, next);
        (0, vitest_1.expect)(OtpService.verifyOtp).toHaveBeenCalledWith(mockTokenPayload.userId, mockOtp);
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
        (0, vitest_1.expect)(AuthService.allowPasswordChange).toHaveBeenCalledWith(mockTokenPayload.userId);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Continue to change password',
        });
    });
    (0, vitest_1.it)('should verify OTP and login user', async () => {
        const payload = { ...mockTokenPayload, purpose: TfaPurpose_1.TfaPurpose.LOGIN };
        vitest_1.vi.spyOn(OtpService, 'verifyOtp').mockResolvedValue();
        vitest_1.vi.spyOn(TokenUtils, 'storeRefreshToken').mockResolvedValue();
        vitest_1.vi.spyOn(JwtUtils, 'generateAccessToken').mockReturnValue(mockTokens.access);
        vitest_1.vi.spyOn(JwtUtils, 'generateRefreshToken').mockReturnValue(mockTokens.refresh);
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(JwtUtils, 'verifyTfaToken').mockReturnValue(payload);
        await (0, verifyOtp_controller_1.verifyOtpController)(req, res, next);
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
        (0, vitest_1.expect)(OtpService.verifyOtp).toHaveBeenCalledWith(payload.userId, mockOtp);
        (0, vitest_1.expect)(prisma_1.prisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: payload.userId },
        });
        (0, vitest_1.expect)(JwtUtils.generateAccessToken).toHaveBeenCalled();
        (0, vitest_1.expect)(JwtUtils.generateRefreshToken).toHaveBeenCalled();
        (0, vitest_1.expect)(TokenUtils.storeRefreshToken).toHaveBeenCalledWith(prisma_1.prisma, mockTokens.refresh, mockUser.id, req.clientMeta);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(201);
        (0, vitest_1.expect)(res.cookie).toHaveBeenCalledWith('refreshToken', mockTokens.refresh, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV == 'production',
            sameSite: 'strict',
            maxAge: token_constants_1.tokenExpirations.REFRESH_TOKEN_EXPIRY_MS,
            path: '/api/auth/refresh',
        });
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Login successful',
            data: { tokens: { access: mockTokens.access } },
        });
    });
    (0, vitest_1.it)('should throw if otp is invalid', async () => {
        vitest_1.vi.spyOn(OtpService, 'verifyOtp').mockRejectedValue(new HttpError_1.HttpError({
            status: 401,
            code: CommonErrorCode_1.CommonErrorCode.UNAUTHORIZED,
            message: '',
        }));
        vitest_1.vi.spyOn(JwtUtils, 'verifyTfaToken').mockReturnValue(mockTokenPayload);
        await (0, verifyOtp_controller_1.verifyOtpController)(req, res, next);
        (0, vitest_1.expect)(next).toHaveBeenCalled();
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
    });
    (0, vitest_1.it)('should throw if token is invalid', async () => {
        vitest_1.vi.spyOn(OtpService, 'verifyOtp').mockResolvedValue();
        vitest_1.vi.spyOn(JwtUtils, 'verifyTfaToken').mockRejectedValue(new HttpError_1.HttpError({
            status: 500,
            code: CommonErrorCode_1.CommonErrorCode.INTERNAL_SERVER_ERROR,
            message: '',
        }));
        await (0, verifyOtp_controller_1.verifyOtpController)(req, res, next);
        (0, vitest_1.expect)(next).toHaveBeenCalled();
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(500);
    });
});
