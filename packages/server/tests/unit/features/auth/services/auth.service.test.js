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
const authService = __importStar(require("@/features/auth/services/auth.service"));
const bcrypt = __importStar(require("@/lib/bcrypt"));
const jwtUtils = __importStar(require("@/lib/jwt"));
const tokenUtils = __importStar(require("@/features/auth/utils/token.util"));
const HttpError_1 = require("@/errors/HttpError");
const prisma_1 = require("@/lib/prisma");
const client_1 = require("@prisma/client");
const AuthErrorCode_1 = require("@/features/auth/constants/AuthErrorCode");
const CommonErrorCode_1 = require("@/errors/CommonErrorCode");
const redis_1 = __importDefault(require("@/lib/redis/redis"));
const redisKeys_1 = require("@/lib/redis/redisKeys");
const auth_config_1 = require("@/features/auth/auth.config");
vitest_1.vi.mock('@/lib/prisma');
const meta = { ipAddress: '127.0.0.1', userAgent: 'Vitest' };
const mockUser = {
    id: 'user-id',
    email: 'email@example.com',
    createdAt: new Date(),
    role: 'USER',
};
(0, vitest_1.describe)('signup()', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.it)('should through if fields are missing', async () => {
        await (0, vitest_1.expect)(authService.signup('', 'email', 'pass', meta)).rejects.toThrow(HttpError_1.HttpError);
        await (0, vitest_1.expect)(authService.signup('username', '', 'pass', meta)).rejects.toThrow(HttpError_1.HttpError);
        await (0, vitest_1.expect)(authService.signup('username', 'email', '', meta)).rejects.toThrow(HttpError_1.HttpError);
    });
    (0, vitest_1.it)('returns user and tokens on successful signup', async () => {
        const mockAccessToken = 'access-token';
        const mockRefreshToken = 'refresh-token';
        vitest_1.vi.spyOn(bcrypt, 'hashPassword').mockResolvedValue('hashed-pass');
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'create').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(jwtUtils, 'generateAccessToken').mockReturnValue(mockAccessToken);
        vitest_1.vi.spyOn(jwtUtils, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
        const storeRefreshToken = vitest_1.vi
            .spyOn(tokenUtils, 'storeRefreshToken')
            .mockResolvedValue();
        const res = await authService.signup('user', mockUser.email, 'pass123', meta);
        (0, vitest_1.expect)(res.user).toMatchObject(mockUser);
        (0, vitest_1.expect)(res.tokens.access).toBe(mockAccessToken);
        (0, vitest_1.expect)(res.tokens.refresh).toBe(mockRefreshToken);
        (0, vitest_1.expect)(storeRefreshToken).toHaveBeenCalledWith(prisma_1.prisma, mockRefreshToken, mockUser.id, meta);
    });
    (0, vitest_1.it)('throws 409 if email is duplicate (P2002)', async () => {
        vitest_1.vi.spyOn(bcrypt, 'hashPassword').mockResolvedValue('hashed-pass');
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'create').mockRejectedValue(new client_1.Prisma.PrismaClientKnownRequestError('error', {
            code: 'P2002',
            clientVersion: '4.0.0',
        }));
        await (0, vitest_1.expect)(authService.signup('user', 'email@example.com', 'pass', meta)).rejects.toMatchObject({ status: 409 });
    });
    (0, vitest_1.it)('throws 500 on unknown error', async () => {
        vitest_1.vi.spyOn(bcrypt, 'hashPassword').mockResolvedValue('hashed-pass');
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'create').mockRejectedValue(new Error('Unexpected'));
        await (0, vitest_1.expect)(authService.signup('user', 'email@example.com', 'pass123', meta)).rejects.toMatchObject({ status: 500 });
    });
});
(0, vitest_1.describe)('login()', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.it)('should throw if fields are missing', async () => {
        const errorObj = {
            status: 400,
            code: CommonErrorCode_1.CommonErrorCode.MISSING_FIELDS,
        };
        await (0, vitest_1.expect)(authService.login('email', '', meta)).rejects.toMatchObject(errorObj);
        await (0, vitest_1.expect)(authService.login('', 'pass', meta)).rejects.toMatchObject(errorObj);
    });
    (0, vitest_1.it)('should throw if user does not exist', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue(null);
        await (0, vitest_1.expect)(authService.login('email', 'pass', meta)).rejects.toMatchObject({
            status: 401,
            code: AuthErrorCode_1.AuthErrorCode.USER_DOES_NOT_EXIST,
        });
    });
    (0, vitest_1.it)('should throw if password is invalid', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(bcrypt, 'isValidPassword').mockResolvedValue(false);
        await (0, vitest_1.expect)(authService.login(mockUser.email, 'pass', meta)).rejects.toMatchObject({
            status: 401,
            code: AuthErrorCode_1.AuthErrorCode.INVALID_CREDENTIALS,
        });
    });
    (0, vitest_1.it)('should return user and 2fa token on valid credentials', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(bcrypt, 'isValidPassword').mockResolvedValue(true);
        const mockToken = '2fa-token';
        vitest_1.vi.spyOn(jwtUtils, 'generateTfaToken').mockReturnValue(mockToken);
        (0, vitest_1.expect)(await authService.login('email', 'pass', meta)).toMatchObject({
            user: mockUser,
            token: mockToken,
        });
    });
});
(0, vitest_1.describe)('logout()', () => {
    const mockToken = 'refresh-token';
    const mockTokenHash = 'alphabetagama';
    const tokenRecord = {
        id: 'token-id',
        userId: mockUser.id,
        revokedAt: null,
    };
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        vitest_1.vi.spyOn(tokenUtils, 'hashTokenSync').mockReturnValue(mockTokenHash);
        vitest_1.vi.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue({});
    });
    (0, vitest_1.it)('should revoke a single token', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.refreshToken, 'findUnique').mockResolvedValue(tokenRecord);
        const updateSpy = vitest_1.vi
            .spyOn(prisma_1.prisma.refreshToken, 'update')
            .mockResolvedValue({ ...tokenRecord, revokedAt: new Date() });
        const result = await authService.logout(mockToken, meta, false);
        (0, vitest_1.expect)(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(mockToken);
        (0, vitest_1.expect)(prisma_1.prisma.refreshToken.findUnique).toHaveBeenCalledWith({
            where: { tokenHash: mockTokenHash },
            select: { id: true, userId: true, revokedAt: true },
        });
        (0, vitest_1.expect)(updateSpy).toHaveBeenCalledWith({
            where: { id: tokenRecord.id },
            data: { revokedAt: vitest_1.expect.any(Date) },
        });
        (0, vitest_1.expect)(result).toHaveProperty('revokedAt');
    });
    (0, vitest_1.it)('should revoke all tokens if logoutAll is true', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.refreshToken, 'findUnique').mockResolvedValue(tokenRecord);
        const updateManySpy = vitest_1.vi
            .spyOn(prisma_1.prisma.refreshToken, 'updateMany')
            .mockResolvedValue({ count: 2 });
        const result = await authService.logout(mockToken, meta, true);
        (0, vitest_1.expect)(updateManySpy).toHaveBeenCalledWith({
            where: { userId: tokenRecord.userId },
            data: { revokedAt: vitest_1.expect.any(Date) },
        });
        (0, vitest_1.expect)(result).toEqual({ count: 2 });
    });
    (0, vitest_1.it)('should throw if token is not found', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.refreshToken, 'findUnique').mockResolvedValue(null);
        await (0, vitest_1.expect)(authService.logout(mockToken, meta)).rejects.toMatchObject({
            status: 401,
            code: AuthErrorCode_1.AuthErrorCode.INVALID_TOKEN,
        });
    });
    (0, vitest_1.it)('should revoke matching tokens and throw if token was reused', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.refreshToken, 'findUnique').mockResolvedValue({
            ...tokenRecord,
            revokedAt: new Date(),
        });
        const revokeMatchingTokensSpy = vitest_1.vi
            .spyOn(tokenUtils, 'revokeMatchingTokens')
            .mockResolvedValue();
        await (0, vitest_1.expect)(authService.logout(mockToken, meta)).rejects.toMatchObject({
            status: 401,
            code: AuthErrorCode_1.AuthErrorCode.TOKEN_REUSED,
        });
        (0, vitest_1.expect)(revokeMatchingTokensSpy).toHaveBeenCalled();
    });
});
(0, vitest_1.describe)('changePassword()', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.it)('should throw if fields are missing', async () => {
        const errorObj = { status: 400, code: CommonErrorCode_1.CommonErrorCode.MISSING_FIELDS };
        await (0, vitest_1.expect)(authService.changePassword('user-id', '', 'new')).rejects.toMatchObject(errorObj);
        await (0, vitest_1.expect)(authService.changePassword('user-id', 'old', '')).rejects.toMatchObject(errorObj);
        await (0, vitest_1.expect)(authService.changePassword('', 'old', 'new')).rejects.toMatchObject({
            status: 401,
            code: CommonErrorCode_1.CommonErrorCode.UNAUTHORIZED,
        });
    });
    (0, vitest_1.it)('should throw if user does not exist', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue(null);
        await (0, vitest_1.expect)(authService.changePassword('user', 'old', 'pass')).rejects.toMatchObject({
            status: 401,
            code: AuthErrorCode_1.AuthErrorCode.USER_DOES_NOT_EXIST,
        });
    });
    (0, vitest_1.it)('should throw if old password is wrong', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(bcrypt, 'isValidPassword').mockResolvedValue(false);
        await (0, vitest_1.expect)(authService.changePassword('user', 'old', 'new')).rejects.toMatchObject({
            status: 401,
            code: CommonErrorCode_1.CommonErrorCode.UNAUTHORIZED,
        });
    });
    (0, vitest_1.it)('should change update password and delete matching tokens', async () => {
        const mockHashedPassword = 'hashedPswd';
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(bcrypt, 'isValidPassword').mockResolvedValue(true);
        vitest_1.vi.spyOn(bcrypt, 'hashPassword').mockResolvedValue(mockHashedPassword);
        const updateSpy = vitest_1.vi.spyOn(prisma_1.prisma.user, 'update');
        const deleteManySpy = vitest_1.vi.spyOn(prisma_1.prisma.refreshToken, 'deleteMany');
        await authService.changePassword(mockUser.id, 'old', 'pass');
        (0, vitest_1.expect)(updateSpy).toHaveBeenCalledWith({
            where: { id: mockUser.id },
            data: { password: mockHashedPassword },
        });
        (0, vitest_1.expect)(deleteManySpy).toHaveBeenCalledWith({
            where: { userId: mockUser.id },
        });
    });
});
(0, vitest_1.describe)('allowPasswordChange()', () => {
    (0, vitest_1.it)('should throw if userId is missing', async () => {
        await (0, vitest_1.expect)(authService.allowPasswordChange('')).rejects.toMatchObject({
            status: 401,
            code: CommonErrorCode_1.CommonErrorCode.UNAUTHORIZED,
        });
    });
    (0, vitest_1.it)('should set password change identifier for user in redis', async () => {
        const redisSpy = vitest_1.vi.spyOn(redis_1.default, 'set');
        await authService.allowPasswordChange(mockUser.id);
        (0, vitest_1.expect)(redisSpy).toHaveBeenCalledWith(redisKeys_1.RedisKeys.auth.allowPasswordChange(mockUser.id), vitest_1.expect.any(Number), 'EX', auth_config_1.authConfig.PASSWORD_CHANGE_EXPIRY_SECONDS);
    });
});
(0, vitest_1.describe)('refreshTokens()', () => {
    const mockToken = 'token';
    const mockHashedToken = 'hashed-token';
    const mockTokenRecord = {
        id: 'token-id',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 10000),
        revokedAt: null,
    };
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        vitest_1.vi.spyOn(tokenUtils, 'hashTokenSync').mockReturnValue(mockHashedToken);
        vitest_1.vi.spyOn(prisma_1.prisma, '$transaction');
    });
    (0, vitest_1.it)('should throw if token is invalid', async () => {
        const tx = {
            refreshToken: {
                findUnique: vitest_1.vi.fn().mockResolvedValue(null),
            },
        };
        prisma_1.prisma.$transaction.mockImplementation(async (fn) => {
            await fn(tx);
        });
        await (0, vitest_1.expect)(authService.refreshTokens(mockToken, meta)).rejects.toMatchObject({
            status: 401,
            code: AuthErrorCode_1.AuthErrorCode.INVALID_TOKEN,
        });
    });
    (0, vitest_1.it)('should throw if the token is expired', async () => {
        const expiredTokenRecord = {
            ...mockTokenRecord,
            expiresAt: new Date(Date.now() - 10000),
        };
        const tx = {
            refreshToken: {
                findUnique: vitest_1.vi.fn().mockResolvedValue(expiredTokenRecord),
            },
        };
        prisma_1.prisma.$transaction.mockImplementation(async (fn) => {
            await fn(tx);
        });
        await (0, vitest_1.expect)(authService.refreshTokens(mockToken, meta)).rejects.toMatchObject({ status: 401, code: AuthErrorCode_1.AuthErrorCode.TOKEN_EXPIRED });
    });
    (0, vitest_1.it)('should throw if result is unexpectedly null', async () => {
        prisma_1.prisma.$transaction.mockImplementation(async () => {
            // simulate silent return with no result assignment
        });
        await (0, vitest_1.expect)(authService.refreshTokens(mockToken, meta)).rejects.toMatchObject({ status: 500 });
    });
    (0, vitest_1.it)('should revoke other tokens and throw if token is reused', async () => {
        const reusedToken = { ...mockTokenRecord, revokedAt: new Date() };
        const tx = {
            refreshToken: {
                findUnique: vitest_1.vi.fn().mockResolvedValue(reusedToken),
                updateMany: vitest_1.vi.fn(),
            },
        };
        prisma_1.prisma.$transaction.mockImplementation(async (fn) => {
            await fn(tx);
        });
        const revokeMatchingTokensSpy = vitest_1.vi.spyOn(tokenUtils, 'revokeMatchingTokens');
        await (0, vitest_1.expect)(authService.refreshTokens(mockToken, meta)).rejects.toMatchObject({ status: 401, code: AuthErrorCode_1.AuthErrorCode.TOKEN_REUSED });
        (0, vitest_1.expect)(revokeMatchingTokensSpy).toBeCalledWith(tx, reusedToken.userId, meta);
    });
    (0, vitest_1.it)('should refresh tokens successfully', async () => {
        const tx = {
            refreshToken: {
                findUnique: vitest_1.vi.fn().mockResolvedValue(mockTokenRecord),
                update: vitest_1.vi.fn().mockResolvedValue({}),
            },
        };
        const newAccessToken = 'new-access-token';
        const newRefreshToken = 'new-refresh-token';
        prisma_1.prisma.$transaction.mockImplementation(async (fn) => {
            await fn(tx);
        });
        vitest_1.vi.spyOn(tokenUtils, 'buildTokenPayload').mockReturnValue({});
        vitest_1.vi.spyOn(jwtUtils, 'generateAccessToken').mockReturnValue(newAccessToken);
        vitest_1.vi.spyOn(jwtUtils, 'generateRefreshToken').mockReturnValue(newRefreshToken);
        const storeRefreshTokenSpy = vitest_1.vi
            .spyOn(tokenUtils, 'storeRefreshToken')
            .mockResolvedValue();
        const result = await authService.refreshTokens(mockToken, meta);
        (0, vitest_1.expect)(result.tokens.access).toBe(newAccessToken);
        (0, vitest_1.expect)(result.tokens.refresh).toBe(newRefreshToken);
        (0, vitest_1.expect)(storeRefreshTokenSpy).toHaveBeenCalledWith(tx, newRefreshToken, mockTokenRecord.userId, meta);
    });
});
