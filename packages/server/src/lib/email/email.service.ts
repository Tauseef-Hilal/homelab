import nodemailer from 'nodemailer';
import { env } from '@shared/config/env';
import { EmailPayload } from './types';

let transporter: nodemailer.Transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
}: EmailPayload): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: env.SMTP_EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error('Failed to send email');
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const subject = '🔐 Your OTP for Secure Login';
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 24px; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #333;">👋 Hello!</h2>
      <p style="font-size: 16px;">Your One-Time Password (OTP) is:</p>
      <div style="font-size: 28px; font-weight: bold; margin: 16px 0; color: #2e7d32;">${otp}</div>
      <p style="font-size: 14px; color: #666;">This OTP is valid for the next 10 minutes. If you did not request this, please ignore this email.</p>
      <p style="margin-top: 24px; font-size: 13px; color: #aaa;">- Team Homelab</p>
    </div>
  `;

  await sendEmail({ to, subject, html });
}
