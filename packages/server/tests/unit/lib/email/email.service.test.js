"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tests/services/email.test.ts
const vitest_1 = require("vitest");
const nodemailer_1 = __importDefault(require("nodemailer"));
const email_service_1 = require("@/lib/email/email.service");
const env_1 = require("@/config/env");
vitest_1.vi.mock('nodemailer');
vitest_1.vi.mock('@/config/env', () => ({
    env: {
        SMTP_HOST: 'smtp.test.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user@example.com',
        SMTP_PASS: 'test-pass',
        SMTP_EMAIL_FROM: 'user@example.com',
    },
}));
const mockSendMail = vitest_1.vi.fn();
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    nodemailer_1.default.createTransport.mockReturnValue({
        sendMail: mockSendMail,
    });
});
(0, vitest_1.describe)('sendEmail', () => {
    (0, vitest_1.it)('should call sendMail with correct payload', async () => {
        const payload = {
            to: 'test@example.com',
            subject: 'Hello',
            html: '<p>Hi there</p>',
        };
        await (0, email_service_1.sendEmail)(payload);
        (0, vitest_1.expect)(mockSendMail).toHaveBeenCalledWith({
            from: env_1.env.SMTP_EMAIL_FROM,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
        });
    });
    (0, vitest_1.it)('should throw an error if sendMail fails', async () => {
        mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));
        await (0, vitest_1.expect)((0, email_service_1.sendEmail)({
            to: 'fail@example.com',
            subject: 'Fail Test',
            html: '<p>fail</p>',
        })).rejects.toThrow('Failed to send email');
    });
});
(0, vitest_1.describe)('sendOtpEmail', () => {
    (0, vitest_1.it)('should call sendEmail with OTP in HTML', async () => {
        const to = 'user@example.com';
        const otp = '123456';
        await (0, email_service_1.sendOtpEmail)(to, otp);
        const callArg = mockSendMail.mock.calls[0][0];
        (0, vitest_1.expect)(callArg.to).toBe(to);
        (0, vitest_1.expect)(callArg.subject).toContain('OTP');
        (0, vitest_1.expect)(callArg.html).toContain(otp);
    });
});
