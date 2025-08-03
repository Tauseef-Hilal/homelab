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
const AuthService = __importStar(require("@/features/auth/services/auth.service"));
const changePassword_controller_1 = require("@/features/auth/controllers/changePassword.controller");
(0, vitest_1.describe)('changePasswordController', () => {
    let req;
    let res;
    let next;
    (0, vitest_1.beforeEach)(() => {
        req = {
            user: {
                id: 'user-123',
            },
            body: {
                oldPassword: 'old-password',
                newPassword: 'new-password',
            },
            clientMeta: { ipAddress: '127.0.0.1', userAgent: 'Vitest' },
        };
        res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        next = vitest_1.vi.fn().mockImplementation((err) => {
            (0, error_middleware_1.errorHandler)(err, req, res, next);
        });
        vitest_1.vi.spyOn(AuthService, 'changePassword').mockResolvedValue();
    });
    (0, vitest_1.it)('should throw if user has not verified OTP', async () => {
        vitest_1.vi.spyOn(redis_1.default, 'get').mockResolvedValue(null);
        await (0, changePassword_controller_1.changePasswordController)(req, res, next);
        (0, vitest_1.expect)(next).toHaveBeenCalled();
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
    });
    (0, vitest_1.it)('should successfully change password if user has verified OTP', async () => {
        vitest_1.vi.spyOn(redis_1.default, 'get').mockResolvedValue('true');
        await (0, changePassword_controller_1.changePasswordController)(req, res, next);
        (0, vitest_1.expect)(AuthService.changePassword).toHaveBeenCalledWith(req.user.id, req.body.oldPassword, req.body.newPassword);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Password changed successfully',
        });
    });
});
