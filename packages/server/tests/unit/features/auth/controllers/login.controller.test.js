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
const login_controller_1 = require("@/features/auth/controllers/login.controller");
const AuthService = __importStar(require("@/features/auth/services/auth.service"));
const OtpService = __importStar(require("@/features/auth/services/otp.service"));
(0, vitest_1.describe)('loginController', () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockToken = 'tfa-token';
    let req;
    let res;
    let next;
    (0, vitest_1.beforeEach)(() => {
        req = {
            body: {
                email: 'test@example.com',
                password: 'Test@12345678',
            },
            clientMeta: { ipAddress: '127.0.0.1', userAgent: 'Vitest' },
        };
        res = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn(),
        };
        next = vitest_1.vi.fn();
        vitest_1.vi.spyOn(OtpService, 'sendOtp').mockResolvedValue();
        vitest_1.vi.spyOn(AuthService, 'login').mockResolvedValue({
            user: mockUser,
            token: mockToken,
        });
    });
    (0, vitest_1.it)('should respond with 2fa token', async () => {
        await (0, login_controller_1.loginController)(req, res, next);
        (0, vitest_1.expect)(AuthService.login).toHaveBeenCalledWith(req.body.email, req.body.password, req.clientMeta);
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Verify OTP to login',
            token: mockToken,
        });
    });
});
