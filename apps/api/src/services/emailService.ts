import { Resend } from 'resend';
import { prisma } from '../lib/prisma';
import * as templates from '../templates/emailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || 'HookSwing';

function getFrom(): string {
  return `"${FROM_NAME}" <${FROM_EMAIL}>`;
}

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
  mail: { from: string; replyTo: string; to: string; subject: string; html: string; text: string },
  meta: { userId?: string; to: string; subject: string; type: string },
  retries = 2
): Promise<{ success: boolean; error?: string }> {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await logEmail({ ...meta, status: 'pending' });

      const { data, error } = await resend.emails.send({
        from: mail.from,
        replyTo: mail.replyTo,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.id) {
        throw new Error('Resend returned no email ID');
      }

      await logEmail({ ...meta, status: 'sent' });
      return { success: true };
    } catch (err: any) {
      lastError = err;
      console.error(`Email send attempt ${attempt} failed:`, err.message);

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
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY not set' };
  }
  try {
    // Resend doesn't have a simple "ping" API, so we list domains to verify the key works
    await resend.domains.list();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
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
  return count < 5;
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
  return count < 3;
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
      from: getFrom(),
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
      from: getFrom(),
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
      from: getFrom(),
      replyTo: FROM_EMAIL,
      to,
      subject: 'Welcome to HookSwing',
      html,
      text,
    },
    { userId, to, subject: 'Welcome to HookSwing', type: 'welcome' }
  );
}
