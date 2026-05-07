import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import * as templates from '../templates/emailTemplates';

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'support@hookswing.com';
const FROM_NAME = process.env.FROM_NAME || 'HookSwing';

// Railway blocks port 465 (SSL) on many plans. Port 587 (STARTTLS) is the
// standard submission port and has better chances of working on cloud hosts.
// We still keep a 465 fallback for self-hosted / non-Railway deploys.
const transporter587 = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  // Force IPv4 — Railway containers have no IPv6 route.
  family: 4,
  pool: false,
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000,
} as any);

const transporter465 = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  family: 4,
  pool: false,
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000,
} as any);

// Graceful shutdown — close any hanging SMTP sockets on deploy restart
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing SMTP transporters...');
  transporter587.close();
  transporter465.close();
  process.exit(0);
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

async function trySend(
  transporter: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions
): Promise<void> {
  await transporter.sendMail(mailOptions);
}

async function sendWithRetry(
  mailOptions: nodemailer.SendMailOptions,
  meta: { userId?: string; to: string; subject: string; type: string },
  retries = 2
): Promise<{ success: boolean; error?: string }> {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await logEmail({ ...meta, status: 'pending' });

      // Try port 587 first (STARTTLS), fall back to 465 (SSL)
      try {
        await trySend(transporter587, mailOptions);
      } catch (err587: any) {
        const isConnectionError =
          err587.message?.includes('timeout') ||
          err587.message?.includes('ECONNREFUSED') ||
          err587.message?.includes('ENETUNREACH') ||
          err587.message?.includes('ETIMEDOUT');

        if (isConnectionError) {
          console.log(`Port 587 failed (${err587.message}), trying port 465...`);
          await trySend(transporter465, mailOptions);
        } else {
          throw err587;
        }
      }

      await logEmail({ ...meta, status: 'sent' });
      return { success: true };
    } catch (err: any) {
      lastError = err;
      console.error(`Email send attempt ${attempt} failed:`, err.message);

      // Don't retry on permanent errors
      if (err.responseCode === 550 || err.responseCode === 551 || err.responseCode === 552) {
        break;
      }

      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 6000);
        await sleep(delay);
      }
    }
  }

  const errorMsg = lastError?.message || 'Unknown error';
  await logEmail({
    ...meta,
    status: 'failed',
    error: errorMsg,
  });
  return { success: false, error: errorMsg };
}

export async function testSmtpConnection(): Promise<{ ok: boolean; error?: string }> {
  // Test 587 first, then 465
  try {
    await transporter587.verify();
    return { ok: true };
  } catch (err587: any) {
    try {
      await transporter465.verify();
      return { ok: true };
    } catch (err465: any) {
      return { ok: false, error: `587: ${err587.message}; 465: ${err465.message}` };
    }
  }
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
  return count < 5; // bumped from 3 → 5 for easier testing
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
  return count < 3; // bumped from 2 → 3
}

// ── Send functions ──

export async function sendVerificationEmail(
  to: string,
  otp: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const { html, text } = templates.verificationTemplate(otp, 15);
  return sendWithRetry(
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
): Promise<{ success: boolean; error?: string }> {
  const { html, text } = templates.passwordResetTemplate(resetUrl, 60);
  return sendWithRetry(
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
): Promise<{ success: boolean; error?: string }> {
  const { html, text } = templates.welcomeTemplate(name);
  return sendWithRetry(
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
