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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const env_1 = require("@/config/env");
const error_middleware_1 = require("@/middleware/error.middleware");
const AuthService = __importStar(require("@/features/auth/services/auth.service"));
const refresh_controller_1 = require("@/features/auth/controllers/refresh.controller");
const token_constants_1 = require("@/constants/token.constants");
(0, vitest_1.describe)('refreshController', () => {
    const mockTokens = { access: 'access-token', refresh: 'refresh-token' };
    const mockOldToken = 'old-token';
    let req;
    let res;
    let next;
    (0, vitest_1.beforeEach)(() => {
        req = {
            user: {
                id: 'user-123',
                email: 'user@example.com',
            },
            cookies: {
                refreshToken: mockOldToken,
            },
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
        vitest_1.vi.spyOn(AuthService, 'refreshTokens').mockResolvedValue({
            tokens: mockTokens,
        });
    });
    (0, vitest_1.it)('should successfully refresh tokens', async () => {
        await (0, refresh_controller_1.refreshController)(req, res, next);
        (0, vitest_1.expect)(AuthService.refreshTokens).toHaveBeenCalledWith(mockOldToken, req.clientMeta);
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
            data: { tokens: { access: mockTokens.access } },
        });
    });
    (0, vitest_1.it)('should throw if refresh token is missing', async () => {
        const invalidReq = { ...req, cookies: {} };
        await (0, refresh_controller_1.refreshController)(invalidReq, res, next);
        (0, vitest_1.expect)(next).toHaveBeenCalled();
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
    });
});
