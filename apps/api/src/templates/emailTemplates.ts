const brandColor = '#10b981';
const bgColor = '#0f172a';
const cardBg = '#1e293b';
const textColor = '#f8fafc';
const mutedColor = '#94a3b8';

function baseTemplate(title: string, content: string, textContent: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 480px; margin: 40px auto; padding: 0 20px; }
    .card { background: ${cardBg}; border-radius: 16px; padding: 40px 32px; border: 1px solid #334155; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-text { color: ${brandColor}; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .title { color: ${textColor}; font-size: 20px; font-weight: 600; margin-bottom: 16px; text-align: center; }
    .body { color: ${mutedColor}; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
    .code-box { background: ${bgColor}; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .code { color: ${brandColor}; font-size: 32px; font-weight: 700; font-family: ui-monospace, SFMono-Regular, monospace; letter-spacing: 8px; }
    .button { display: inline-block; background: ${brandColor}; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 32px; }
    .footer a { color: ${brandColor}; text-decoration: none; }
    @media (max-width: 520px) {
      .card { padding: 28px 20px; }
      .code { font-size: 26px; letter-spacing: 6px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-text">🪝 HookSwing</div>
      </div>
      ${content}
      <div class="footer">
        <p>Need help? Contact us at <a href="mailto:support@hookswing.com">support@hookswing.com</a></p>
        <p style="margin-top:8px;">© 2026 HookSwing. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  return { html, text: textContent };
}

export function verificationTemplate(otp: string, expiresMin: number) {
  const title = 'Verify your email - HookSwing';
  const content = `
    <div class="title">Verify your email address</div>
    <div class="body">
      <p>Thanks for signing up for HookSwing! Use the code below to verify your email address. This code will expire in ${expiresMin} minutes.</p>
    </div>
    <div class="code-box">
      <div class="code">${otp}</div>
    </div>
    <div class="body" style="text-align:center;">
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;
  const text = `Verify your email - HookSwing\n\nYour verification code is: ${otp}\n\nThis code expires in ${expiresMin} minutes.\n\nIf you didn't create an account, ignore this email.\n\nNeed help? Contact support@hookswing.com`;
  return baseTemplate(title, content, text);
}

export function passwordResetTemplate(resetUrl: string, expiresMin: number) {
  const title = 'Reset your password';
  const content = `
    <div class="title">Reset your password</div>
    <div class="body">
      <p>We received a request to reset your HookSwing password. Click the button below to set a new password. This link expires in ${expiresMin} minutes.</p>
    </div>
    <div style="text-align:center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <div class="body" style="text-align:center;">
      <p>Or copy and paste this link:</p>
      <p style="word-break:break-all; color:${mutedColor};">${resetUrl}</p>
      <p style="margin-top:16px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  const text = `Reset your password - HookSwing\n\nWe received a request to reset your password. Click the link below (expires in ${expiresMin} minutes):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n\nNeed help? Contact support@hookswing.com`;
  return baseTemplate(title, content, text);
}

export function welcomeTemplate(name: string) {
  const title = 'Welcome to HookSwing';
  const content = `
    <div class="title">Welcome aboard, ${name || 'there'}!</div>
    <div class="body">
      <p>Your email is verified and your account is ready. Here's what you can do next:</p>
      <ul style="padding-left: 20px; color: ${mutedColor};">
        <li>Create your first project and get a unique webhook URL</li>
        <li>Install the CLI: <code style="background:${bgColor};padding:2px 6px;border-radius:4px;">npm install -g hookswing</code></li>
        <li>Forward webhooks to your local machine</li>
        <li>Replay, inspect, and compare payloads</li>
      </ul>
    </div>
    <div style="text-align:center;">
      <a href="https://hookswing.com/dashboard" class="button">Go to Dashboard</a>
    </div>
  `;
  const text = `Welcome to HookSwing, ${name || 'there'}!\n\nYour email is verified and your account is ready.\n\n- Create your first project and get a unique webhook URL\n- Install the CLI: npm install -g hookswing\n- Forward webhooks to your local machine\n- Replay, inspect, and compare payloads\n\nGo to Dashboard: https://hookswing.com/dashboard\n\nNeed help? Contact support@hookswing.com`;
  return baseTemplate(title, content, text);
}

export function teamInviteTemplate(inviterName: string, teamName: string, acceptUrl: string, role: string) {
  const title = `You've been invited to ${teamName}`;
  const content = `
    <div class="title">Team Invitation</div>
    <div class="body">
      <p><strong>${inviterName || 'Someone'}</strong> has invited you to join <strong>${teamName}</strong> on HookSwing as a <strong>${role}</strong>.</p>
      <p>HookSwing is a webhook debugging platform. Join the team to share projects, inspect webhooks together, and collaborate in real time.</p>
    </div>
    <div style="text-align:center;">
      <a href="${acceptUrl}" class="button">Accept Invitation</a>
    </div>
    <div class="body" style="text-align:center;">
      <p>Or copy and paste this link:</p>
      <p style="word-break:break-all; color:${mutedColor};">${acceptUrl}</p>
      <p style="margin-top:16px;">This invitation expires in 7 days. If you don't have a HookSwing account yet, sign up with this email address and the invite will be waiting for you.</p>
    </div>
  `;
  const text = `Team Invitation - HookSwing\n\n${inviterName || 'Someone'} has invited you to join ${teamName} as a ${role}.\n\nAccept your invitation:\n${acceptUrl}\n\nThis invitation expires in 7 days. If you don't have a HookSwing account yet, sign up with this email address and the invite will be waiting for you.\n\nNeed help? Contact support@hookswing.com`;
  return baseTemplate(title, content, text);
}
