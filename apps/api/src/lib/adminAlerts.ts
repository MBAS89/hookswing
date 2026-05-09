import axios from 'axios';
import { prisma } from './prisma';

export const ADMIN_ALERT_EVENTS = [
  'user_registered',
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'payment_failed',
  'payment_succeeded',
  'plan_changed_by_admin',
  'support_message',
] as const;

export type AdminAlertEvent = (typeof ADMIN_ALERT_EVENTS)[number];

const eventLabels: Record<AdminAlertEvent, string> = {
  user_registered: '👤 New User Registered',
  subscription_created: '💳 New Subscription',
  subscription_updated: '🔄 Subscription Updated',
  subscription_cancelled: '❌ Subscription Cancelled',
  payment_failed: '⚠️ Payment Failed',
  payment_succeeded: '✅ Payment Succeeded',
  plan_changed_by_admin: '🔧 Plan Changed by Admin',
  support_message: '💬 Support Message',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildTelegramMessage(event: AdminAlertEvent, data: Record<string, any>): string {
  const label = eventLabels[event] || event;
  const now = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let text = `<b>${label}</b>\n<em>${now}</em>\n`;

  switch (event) {
    case 'user_registered':
      text += `\n📧 Email: <code>${escapeHtml(data.email || 'N/A')}</code>`;
      text += data.name ? `\n👤 Name: ${escapeHtml(data.name)}` : '';
      text += `\n🆔 User ID: <code>${data.userId || 'N/A'}</code>`;
      break;
    case 'subscription_created':
      text += `\n📧 User: <code>${escapeHtml(data.email || 'N/A')}</code>`;
      text += `\n📦 Plan: <b>${data.plan || 'N/A'}</b>`;
      text += data.interval ? `\n📅 Interval: ${data.interval}` : '';
      break;
    case 'subscription_updated':
      text += `\n📧 User: <code>${escapeHtml(data.email || 'N/A')}</code>`;
      text += `\n📦 New Plan: <b>${data.plan || 'N/A'}</b>`;
      text += data.previousPlan ? `\n📦 Previous: ${data.previousPlan}` : '';
      break;
    case 'subscription_cancelled':
      text += `\n📧 User: <code>${escapeHtml(data.email || 'N/A')}</code>`;
      text += `\n📦 Plan: <b>${data.plan || 'N/A'}</b>`;
      text += data.reason ? `\n📝 Reason: ${escapeHtml(data.reason)}` : '';
      break;
    case 'payment_failed':
      text += `\n📧 User: <code>${escapeHtml(data.email || 'N/A')}</code>`;
      text += `\n📦 Plan: <b>${data.plan || 'N/A'}</b>`;
      text += data.amount ? `\n💰 Amount: $${(data.amount / 100).toFixed(2)}` : '';
      break;
    case 'payment_succeeded':
      text += `\n📧 User: <code>${escapeHtml(data.email || 'N/A')}</code>`;
      text += `\n📦 Plan: <b>${data.plan || 'N/A'}</b>`;
      text += data.amount ? `\n💰 Amount: $${(data.amount / 100).toFixed(2)}` : '';
      break;
    case 'plan_changed_by_admin':
      text += `\n📧 User: <code>${escapeHtml(data.email || 'N/A')}</code>`;
      text += `\n📦 New Plan: <b>${data.plan || 'N/A'}</b>`;
      text += data.previousPlan ? `\n📦 Previous: ${data.previousPlan}` : '';
      text += data.adminEmail ? `\n👤 By Admin: ${escapeHtml(data.adminEmail)}` : '';
      break;
    case 'support_message':
      text += `\n📧 User: <code>${escapeHtml(data.email || 'N/A')}</code>`;
      text += data.name ? `\n👤 Name: ${escapeHtml(data.name)}` : '';
      text += `\n💬 Message: <em>${escapeHtml(data.message || 'N/A')}</em>`;
      text += `\n\n<a href="https://hookswing.com/dashboard/admin">Open Admin Dashboard →</a>`;
      break;
  }

  return text;
}

export async function fireAdminAlert(event: AdminAlertEvent, data: Record<string, any>) {
  try {
    const configs = await prisma.adminAlertConfig.findMany({
      where: { enabled: true },
    });

    const targets = configs.filter((c) => c.events.includes(event));
    if (targets.length === 0) return;

    const text = buildTelegramMessage(event, data);

    for (const config of targets) {
      try {
        if (config.type === 'telegram') {
          const cfg = (config.config || {}) as { chatId?: string; botToken?: string };
          const chatId = cfg.chatId;
          if (!chatId || !config.url) continue;

          await axios.post(
            config.url,
            {
              chat_id: chatId,
              text,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            },
            { timeout: 5000 }
          );
        }
      } catch (err: any) {
        const telegramError = err.response?.data?.description || err.message;
        console.error(`[AdminAlert] Failed to send ${config.type} alert for ${event}:`, telegramError);
      }
    }
  } catch (err: any) {
    console.error('[AdminAlert] Error firing admin alert:', err.message || err);
  }
}
