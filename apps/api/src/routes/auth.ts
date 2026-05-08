import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { authRateLimit, emailRateLimit } from '../middleware/rateLimit';
import type { AuthRequest } from '../middleware/auth';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  canSendVerification,
  canSendPasswordReset,
  testSmtpConnection,
} from '../services/emailService';

const router = Router();

function cliSuccessPage(accessToken: string, refreshToken: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HookSwing CLI — Login Success</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .container {
      max-width: 560px;
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 32px;
    }
    h1 { font-size: 20px; margin-bottom: 8px; color: #fff; }
    p { color: #94a3b8; margin-bottom: 20px; font-size: 14px; line-height: 1.5; }
    .token-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      position: relative;
    }
    .token-box label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .token-box code {
      font-family: 'SF Mono', Menlo, Consolas, monospace;
      font-size: 12px;
      color: #e2e8f0;
      word-break: break-all;
      display: block;
      line-height: 1.4;
    }
    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #334155;
      color: #e2e8f0;
      border: none;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
    }
    .copy-btn:hover { background: #475569; }
    .done { text-align: center; margin-top: 24px; }
    .done-icon { font-size: 40px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="done"><div class="done-icon">✅</div></div>
    <h1>CLI Login Successful</h1>
    <p>Copy the tokens below and paste them into your terminal when prompted.</p>

    <div class="token-box">
      <label>Access Token</label>
      <code id="at">${accessToken}</code>
      <button class="copy-btn" onclick="copy('at')">Copy</button>
    </div>

    <div class="token-box">
      <label>Refresh Token</label>
      <code id="rt">${refreshToken}</code>
      <button class="copy-btn" onclick="copy('rt')">Copy</button>
    </div>

    <p style="margin-top:20px;font-size:13px;">After copying, return to your terminal and paste the tokens to complete login.</p>
  </div>
  <script>
    function copy(id) {
      const text = document.getElementById(id).innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('[onclick="copy(\\'' + id + '\\')"]');
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = 'Copy', 1500);
      });
    }
  </script>
</body>
</html>`;
}

function cliErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HookSwing CLI — Login Failed</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .container {
      max-width: 480px;
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
    }
    h1 { font-size: 20px; margin: 12px 0 8px; color: #fff; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
    .icon { font-size: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>CLI Login Failed</h1>
    <p>${message}</p>
    <p style="margin-top:16px;">Please close this window and try again in your terminal:<br><code style="color:#fbbf24;">hookswing login --github</code></p>
  </div>
</body>
</html>`;
}

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
    expiresIn: '30d',
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

function generateRandomPassword(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// --- GitHub OAuth ---
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }

  const redirectUri = `${process.env.FRONTEND_URL || 'https://hookswing.com'}/api/auth/github/callback`;
  const mode = req.query.mode as string || 'web';
  const callbackPort = req.query.callback_port as string | undefined;
  const state = Buffer.from(JSON.stringify({ random: Math.random().toString(36).substring(2, 15), mode, callbackPort })).toString('base64');

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);

  res.redirect(url.toString());
});

router.get('/github/callback', async (req, res) => {
  const { code, state, error: githubError, error_description: githubErrorDesc } = req.query as { code?: string; state?: string; error?: string; error_description?: string };

  // Decode state to check if this is a CLI login
  let mode = 'web';
  let callbackPort: string | undefined;
  try {
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      mode = decoded.mode || 'web';
      callbackPort = decoded.callbackPort;
    }
  } catch { /* ignore invalid state */ }

  if (githubError) {
    console.error('[GitHub OAuth] GitHub returned error:', githubError, githubErrorDesc);
    if (mode === 'cli') {
      return res.type('html').send(cliErrorPage('GitHub login denied or failed.'));
    }
    return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=github_denied`);
  }

  if (!code) {
    console.error('[GitHub OAuth] No code in query params');
    if (mode === 'cli') {
      return res.type('html').send(cliErrorPage('No authorization code received from GitHub.'));
    }
    return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=no_code`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[GitHub OAuth] Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
    if (mode === 'cli') {
      return res.type('html').send(cliErrorPage('GitHub OAuth is not configured on the server.'));
    }
    return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=oauth_not_configured`);
  }

  // --- Step 1: Exchange code for access token ---
  let accessToken: string;
  try {
    const redirectUri = `${process.env.FRONTEND_URL || 'https://hookswing.com'}/api/auth/github/callback`;
    console.log('[GitHub OAuth] Exchanging code for token, redirectUri:', redirectUri);

    // GitHub token endpoint prefers form-encoded data
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      params.toString(),
      { headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    console.log('[GitHub OAuth] Token response:', JSON.stringify(tokenRes.data));

    if (tokenRes.data.error) {
      console.error('[GitHub OAuth] GitHub token error:', tokenRes.data.error, tokenRes.data.error_description);
      if (mode === 'cli') {
        return res.type('html').send(cliErrorPage(`GitHub token exchange failed: ${tokenRes.data.error}`));
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=token_exchange_failed&detail=${encodeURIComponent(tokenRes.data.error)}`);
    }

    accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      console.error('[GitHub OAuth] No access token in response:', tokenRes.data);
      if (mode === 'cli') {
        return res.type('html').send(cliErrorPage('No access token received from GitHub.'));
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=token_exchange_failed`);
    }
  } catch (err: any) {
    console.error('[GitHub OAuth] Token exchange error:', err.response?.data || err.message);
    return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=token_exchange_failed`);
  }

  // --- Step 2: Fetch user profile ---
  let githubUser: any;
  try {
    console.log('[GitHub OAuth] Fetching user profile...');
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    githubUser = userRes.data;
    console.log('[GitHub OAuth] GitHub user:', JSON.stringify({ id: githubUser.id, login: githubUser.login, name: githubUser.name, email: githubUser.email }));
  } catch (err: any) {
    console.error('[GitHub OAuth] Profile fetch error:', err.response?.data || err.message);
    if (mode === 'cli') {
      return res.type('html').send(cliErrorPage('Failed to fetch your GitHub profile.'));
    }
    return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=github_api_error`);
  }

  const githubId = githubUser.id?.toString();
  const name = githubUser.name || githubUser.login;

  // --- Step 3: Fetch email ---
  let email = githubUser.email;
  if (!email) {
    try {
      console.log('[GitHub OAuth] No public email, fetching email list...');
      const emailsRes = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log('[GitHub OAuth] Emails response:', JSON.stringify(emailsRes.data));
      const primaryEmail = emailsRes.data.find((e: any) => e.primary && e.verified);
      const anyVerified = emailsRes.data.find((e: any) => e.verified);
      email = primaryEmail?.email || anyVerified?.email;
    } catch (err: any) {
      console.error('[GitHub OAuth] Email fetch error:', err.response?.data || err.message);
      return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=github_email_error`);
    }
  }

  if (!githubId || !email) {
    console.error('[GitHub OAuth] Missing githubId or email:', { githubId, email });
    if (mode === 'cli') {
      return res.type('html').send(cliErrorPage('Could not retrieve your GitHub email. Please make sure your email is verified on GitHub.'));
    }
    return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=github_no_email`);
  }

  // --- Step 4: Find or create user ---
  let user: any;
  try {
    console.log('[GitHub OAuth] Looking up user by githubId:', githubId);
    user = await prisma.user.findUnique({ where: { githubId } });

    if (!user) {
      console.log('[GitHub OAuth] No user by githubId, checking email:', email);
      const existingByEmail = await prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        console.log('[GitHub OAuth] Linking GitHub to existing user:', existingByEmail.id);
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { githubId },
        });
      } else {
        console.log('[GitHub OAuth] Creating new user for GitHub login');
        const passwordHash = await bcrypt.hash(generateRandomPassword(), 10);
        user = await prisma.user.create({
          data: {
            email,
            name,
            githubId,
            passwordHash,
            emailVerified: true,
          },
        });
        console.log('[GitHub OAuth] New user created:', user.id);
      }
    }
  } catch (err: any) {
    console.error('[GitHub OAuth] DB error:', err.message);
    if (mode === 'cli') {
      return res.type('html').send(cliErrorPage('Database error. Please try again.'));
    }
    return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=db_error`);
  }

  // --- Step 5: Generate tokens and redirect ---
  try {
    const { accessToken: jwtAccess, refreshToken } = generateTokens(user.id);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    if (mode === 'cli' && callbackPort) {
      console.log('[GitHub OAuth] CLI mode — redirecting to localhost:' + callbackPort);
      const redirectUrl = new URL(`http://localhost:${callbackPort}`);
      redirectUrl.searchParams.set('accessToken', jwtAccess);
      redirectUrl.searchParams.set('refreshToken', refreshToken);
      return res.redirect(redirectUrl.toString());
    }

    if (mode === 'cli') {
      console.log('[GitHub OAuth] CLI mode — showing token page');
      return res.type('html').send(cliSuccessPage(jwtAccess, refreshToken));
    }

    const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/auth/github/callback`);
    redirectUrl.searchParams.set('accessToken', jwtAccess);
    redirectUrl.searchParams.set('refreshToken', refreshToken);

    console.log('[GitHub OAuth] Success! Redirecting to frontend');
    res.redirect(redirectUrl.toString());
  } catch (err: any) {
    console.error('[GitHub OAuth] Token generation error:', err.message);
    if (mode === 'cli') {
      return res.type('html').send(cliErrorPage('Token generation failed. Please try again.'));
    }
    return res.redirect(`${process.env.FRONTEND_URL || 'https://hookswing.com'}/login?error=token_gen_error`);
  }
});

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

  // Send verification email (await with 12s timeout so user knows if it fails)
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: otpHash,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const emailResult = await Promise.race([
    sendVerificationEmail(user.email, otp, user.id),
    new Promise<{ success: false; error: string }>((resolve) =>
      setTimeout(() => resolve({ success: false, error: 'Email sending timed out' }), 12000)
    ),
  ]);

  if (!emailResult.success) {
    console.error('Failed to send verification email:', emailResult.error);
    return res.json({
      requiresEmailVerification: true,
      email: user.email,
      emailError: `Could not send verification email: ${emailResult.error}`,
    });
  }

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

  if (!user.passwordHash) {
    return res.status(401).json({ error: 'This account uses GitHub login. Please sign in with GitHub.' });
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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

    // Get current month usage
    const now = new Date();
    const usage = await prisma.webhookUsage.findUnique({
      where: { userId_year_month: { userId: user.id, year: now.getFullYear(), month: now.getMonth() } },
    });
    const limit = user.plan === 'FREE' ? 500 : 10000;

    res.json({ user, usage: { used: usage?.count || 0, limit } });
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

  if (!user.passwordHash) {
    return res.status(400).json({ error: 'This account uses GitHub login. Please set a password first.' });
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

  if (!user.passwordHash) {
    return res.status(400).json({ error: 'This account uses GitHub login.' });
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
router.post('/send-verification', emailRateLimit, async (req: AuthRequest, res) => {
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

  const emailResult = await Promise.race([
    sendVerificationEmail(user.email, otp, user.id),
    new Promise<{ success: false; error: string }>((resolve) =>
      setTimeout(() => resolve({ success: false, error: 'Email sending timed out' }), 12000)
    ),
  ]);

  if (!emailResult.success) {
    console.error('Failed to resend verification email:', emailResult.error);
    return res.status(500).json({
      error: `Could not send verification email: ${emailResult.error}`,
    });
  }

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

  try {
    await sendWelcomeEmail(user.email, user.name || '', user.id);
  } catch {
    // Non-critical: don't fail verification if welcome email fails
  }

  // Log them in after verification
  const { accessToken, refreshToken } = generateTokens(user.id);
  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({ user: updatedUser, accessToken, refreshToken, message: 'Email verified successfully' });
});

// --- Forgot password ---
router.post('/forgot-password', emailRateLimit, async (req, res) => {
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

  const frontendUrl = process.env.FRONTEND_URL || 'https://hookswing.com';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  const emailResult = await Promise.race([
    sendPasswordResetEmail(user.email, resetUrl, user.id),
    new Promise<{ success: false; error: string }>((resolve) =>
      setTimeout(() => resolve({ success: false, error: 'Email sending timed out' }), 12000)
    ),
  ]);

  if (!emailResult.success) {
    console.error('Failed to send password reset email:', emailResult.error);
    return res.status(500).json({
      error: `Could not send password reset email: ${emailResult.error}`,
    });
  }

  res.json({ message: 'If an account exists, a reset link has been sent' });
});

// --- Debug: SMTP connection test (admin only) ---
router.get('/email-status', async (req: AuthRequest, res) => {
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
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const emailConn = await testSmtpConnection();
  const logs = await prisma.emailLog.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: { to: true, type: true, status: true, error: true, createdAt: true },
  });

  res.json({
    email: {
      ok: emailConn.ok,
      error: emailConn.error,
      config: {
        provider: 'Resend',
        apiKey: process.env.RESEND_API_KEY ? 'configured' : 'missing',
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      },
    },
    recentLogs: logs,
  });
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
