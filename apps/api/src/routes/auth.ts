import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma';
import { authRateLimit } from '../middleware/rateLimit';
import type { AuthRequest } from '../middleware/auth';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  canSendVerification,
  canSendPasswordReset,
} from '../services/emailService';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const login2faSchema = z.object({
  tempToken: z.string(),
  code: z.string().min(6).max(8),
});

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
}

function generateBackupCodes(): { codes: string[]; hashed: string[] } {
  const codes: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
    hashed.push(bcrypt.hashSync(code, 10));
  }
  return { codes, hashed };
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Registration ---
router.post('/register', authRateLimit, async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { email, password, name } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, role: true, plan: true, twoFactorEnabled: true },
  });

  // Send verification email
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: otpHash,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  await sendVerificationEmail(user.email, otp, user.id);

  // Don't log them in yet — they must verify email first
  res.json({ requiresEmailVerification: true, email: user.email });
});

// --- Login ---
router.post('/login', authRateLimit, async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Require email verification before allowing access
  if (!user.emailVerified) {
    return res.json({ requiresEmailVerification: true, email: user.email });
  }

  // If 2FA is enabled, return a temp token
  if (user.twoFactorEnabled) {
    const tempToken = jwt.sign(
      { userId: user.id, step: '2fa' },
      process.env.JWT_SECRET!,
      { expiresIn: '5m' }
    );
    return res.json({ requires2FA: true, tempToken });
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  });
});

// --- Login 2FA verification ---
router.post('/login/2fa', authRateLimit, async (req, res) => {
  const result = login2faSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { tempToken, code } = result.data;

  let decoded: { userId: string; step: string };
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as any;
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (decoded.step !== '2fa') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return res.status(401).json({ error: '2FA not enabled' });
  }

  // Verify TOTP code
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  // Check backup codes if TOTP fails
  let backupCodeUsed = false;
  if (!verified && user.twoFactorBackupCodes) {
    const hashedCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
    for (let i = 0; i < hashedCodes.length; i++) {
      if (await bcrypt.compare(code, hashedCodes[i])) {
        backupCodeUsed = true;
        // Remove used backup code
        hashedCodes.splice(i, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(hashedCodes) },
        });
        break;
      }
    }
  }

  if (!verified && !backupCodeUsed) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  });
});

// --- Refresh ---
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
    };

    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET!, {
      expiresIn: '15m',
    });

    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// --- Logout ---
router.post('/logout', async (req: AuthRequest, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.session.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ success: true });
});

// --- Get current user ---
router.get('/me', async (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true, email: true, name: true, role: true, plan: true, twoFactorEnabled: true, emailVerified: true,
        teams: {
          select: { team: { select: { id: true, name: true } }, role: true },
        },
      },
    });
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- Update profile ---
router.patch('/me', async (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  let userId: string;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { name, email } = result.data;
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    data.email = email;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true, email: true, name: true, role: true, plan: true, twoFactorEnabled: true,
      teams: { include: { team: { select: { id: true, name: true } } } },
    },
  });

  res.json({ user });
});

// --- Change password ---
router.post('/change-password', async (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  let userId: string;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { currentPassword, newPassword } = result.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Invalidate all sessions
  await prisma.session.deleteMany({ where: { userId } });

  res.json({ success: true });
});

// --- 2FA: Setup (generate secret + QR) ---
router.post('/2fa/setup', async (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  let userId: string;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.twoFactorEnabled) {
    return res.status(400).json({ error: '2FA is already enabled' });
  }

  const secret = speakeasy.generateSecret({
    name: `HookSwing (${user.email})`,
    length: 32,
  });

  // Store secret temporarily (not enabled yet)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret.base32 },
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  res.json({
    secret: secret.base32,
    qrCode: qrCodeUrl,
  });
});

// --- 2FA: Verify and enable ---
router.post('/2fa/verify', async (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  let userId: string;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const schema = z.object({ code: z.string().min(6).max(8) });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    return res.status(400).json({ error: '2FA setup not initiated' });
  }
  if (user.twoFactorEnabled) {
    return res.status(400).json({ error: '2FA is already enabled' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: result.data.code,
    window: 1,
  });

  if (!verified) {
    return res.status(401).json({ error: 'Invalid code' });
  }

  const { codes, hashed } = generateBackupCodes();

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorBackupCodes: JSON.stringify(hashed),
    },
  });

  res.json({
    enabled: true,
    backupCodes: codes,
  });
});

// --- 2FA: Disable ---
router.post('/2fa/disable', async (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  let userId: string;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const schema = z.object({
    password: z.string().min(1),
    code: z.string().min(6).max(8),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { password, code } = result.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return res.status(400).json({ error: '2FA is not enabled' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Password is incorrect' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    },
  });

  res.json({ disabled: true });
});

// --- Send verification email ---
router.post('/send-verification', authRateLimit, async (req: AuthRequest, res) => {
  const schema = z.object({ email: z.string().email() });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { email } = result.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Prevent enumeration: same response regardless of whether user exists
  if (!user) {
    return res.json({ message: 'If an account exists, a verification code has been sent' });
  }

  if (user.emailVerified) {
    return res.json({ message: 'If an account exists, a verification code has been sent' });
  }

  if (!await canSendVerification(user.id)) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: otpHash,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  await sendVerificationEmail(user.email, otp, user.id);

  res.json({ message: 'If an account exists, a verification code has been sent' });
});

// --- Verify email ---
router.post('/verify-email', authRateLimit, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { email, code } = result.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.emailVerificationToken || !user.emailVerificationExpires) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  if (user.emailVerificationExpires < new Date()) {
    return res.status(400).json({ error: 'Code has expired' });
  }

  const valid = await bcrypt.compare(code, user.emailVerificationToken);
  if (!valid) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    select: {
      id: true, email: true, name: true, role: true, plan: true, twoFactorEnabled: true,
      teams: { include: { team: { select: { id: true, name: true } } } },
    },
  });

  await sendWelcomeEmail(user.email, user.name || '', user.id);

  // Log them in after verification
  const { accessToken, refreshToken } = generateTokens(user.id);
  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({ user: updatedUser, accessToken, refreshToken, message: 'Email verified successfully' });
});

// --- Forgot password ---
router.post('/forgot-password', authRateLimit, async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { email } = result.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Prevent enumeration: same response regardless
  if (!user) {
    return res.json({ message: 'If an account exists, a reset link has been sent' });
  }

  if (!await canSendPasswordReset(user.id)) {
    return res.json({ message: 'If an account exists, a reset link has been sent' });
  }

  const resetToken = jwt.sign(
    { userId: user.id, type: 'password_reset' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(user.email, resetUrl, user.id);

  res.json({ message: 'If an account exists, a reset link has been sent' });
});

// --- Reset password ---
router.post('/reset-password', authRateLimit, async (req, res) => {
  const schema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { token, newPassword } = result.data;

  let decoded: { userId: string; type: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  if (decoded.type !== 'password_reset') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  if (user.passwordResetExpires < new Date()) {
    return res.status(400).json({ error: 'Token has expired' });
  }

  if (user.passwordResetToken !== token) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Invalidate all sessions
  await prisma.session.deleteMany({ where: { userId: user.id } });

  res.json({ success: true, message: 'Password updated successfully' });
});

export default router;
