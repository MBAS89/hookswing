import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import * as templates from '../templates/emailTemplates';

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'support@hookswing.com';
const FROM_NAME = process.env.FROM_NAME || 'HookSwing';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function logEmail(
  opts: {
    userId?: string;
    to: string;
    subject: string;
    type: string;
    status: 'pending' | 'sent' | 'failed' | 'bounced';
    error?: string;
  }
) {
  try {
    await prisma.emailLog.create({
      data: {
        userId: opts.userId,
        to: opts.to,
        subject: opts.subject,
        type: opts.type,
        status: opts.status,
        error: opts.error,
      },
    });
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}

async function sendWithRetry(
  mailOptions: nodemailer.SendMailOptions,
  meta: { userId?: string; to: string; subject: string; type: string },
  retries = 3
): Promise<void> {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await logEmail({ ...meta, status: 'pending' });
      await transporter.sendMail(mailOptions);
      await logEmail({ ...meta, status: 'sent' });
      return;
    } catch (err: any) {
      lastError = err;
      console.error(`Email send attempt ${attempt} failed:`, err.message);

      // Don't retry on permanent errors
      if (err.responseCode === 550 || err.responseCode === 551 || err.responseCode === 552) {
        break;
      }

      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await sleep(delay);
      }
    }
  }

  await logEmail({
    ...meta,
    status: 'failed',
    error: lastError?.message || 'Unknown error',
  });
}

// ── Rate limiting helpers ──

export async function canSendVerification(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.emailLog.count({
    where: {
      userId,
      type: 'verification',
      status: { in: ['sent', 'pending'] },
      createdAt: { gte: oneHourAgo },
    },
  });
  return count < 3;
}

export async function canSendPasswordReset(userId: string): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.emailLog.count({
    where: {
      userId,
      type: 'password_reset',
      status: { in: ['sent', 'pending'] },
      createdAt: { gte: oneDayAgo },
    },
  });
  return count < 2;
}

// ── Send functions ──

export async function sendVerificationEmail(
  to: string,
  otp: string,
  userId?: string
): Promise<void> {
  const { html, text } = templates.verificationTemplate(otp, 15);
  await sendWithRetry(
    {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      replyTo: FROM_EMAIL,
      to,
      subject: 'Verify your email - HookSwing',
      html,
      text,
    },
    { userId, to, subject: 'Verify your email - HookSwing', type: 'verification' }
  );
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userId?: string
): Promise<void> {
  const { html, text } = templates.passwordResetTemplate(resetUrl, 60);
  await sendWithRetry(
    {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      replyTo: FROM_EMAIL,
      to,
      subject: 'Reset your password',
      html,
      text,
    },
    { userId, to, subject: 'Reset your password', type: 'password_reset' }
  );
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  userId?: string
): Promise<void> {
  const { html, text } = templates.welcomeTemplate(name);
  await sendWithRetry(
    {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      replyTo: FROM_EMAIL,
      to,
      subject: 'Welcome to HookSwing',
      html,
      text,
    },
    { userId, to, subject: 'Welcome to HookSwing', type: 'welcome' }
  );
}
