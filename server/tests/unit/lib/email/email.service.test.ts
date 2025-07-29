// tests/services/email.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { sendEmail, sendOtpEmail } from '@/lib/email/email.service';
import { env } from '@/config/env';

vi.mock('nodemailer');
vi.mock('@/config/env', () => ({
  env: {
    SMTP_HOST: 'smtp.test.com',
    SMTP_PORT: '587',
    SMTP_USER: 'user@example.com',
    SMTP_PASS: 'test-pass',
    SMTP_EMAIL_FROM: 'user@example.com',
  },
}));

const mockSendMail = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  (nodemailer.createTransport as any).mockReturnValue({
    sendMail: mockSendMail,
  });
});

describe('sendEmail', () => {
  it('should call sendMail with correct payload', async () => {
    const payload = {
      to: 'test@example.com',
      subject: 'Hello',
      html: '<p>Hi there</p>',
    };

    await sendEmail(payload);

    expect(mockSendMail).toHaveBeenCalledWith({
      from: env.SMTP_EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  });

  it('should throw an error if sendMail fails', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

    await expect(
      sendEmail({
        to: 'fail@example.com',
        subject: 'Fail Test',
        html: '<p>fail</p>',
      })
    ).rejects.toThrow('Failed to send email');
  });
});

describe('sendOtpEmail', () => {
  it('should call sendEmail with OTP in HTML', async () => {
    const to = 'user@example.com';
    const otp = '123456';

    await sendOtpEmail(to, otp);

    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.to).toBe(to);
    expect(callArg.subject).toContain('OTP');
    expect(callArg.html).toContain(otp);
  });
});
