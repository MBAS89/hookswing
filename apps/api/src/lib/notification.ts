import { prisma } from './prisma';
import { getIO } from './socketio';

export type NotificationType =
  | 'team_invite'
  | 'team_invite_accepted'
  | 'team_invite_declined'
  | 'team_invite_cancelled'
  | 'member_joined'
  | 'member_left'
  | 'member_removed'
  | 'role_changed'
  | 'ownership_transferred'
  | 'comment_added'
  | 'comment_replied'
  | 'webhook_received'
  | 'plan_changed'
  | 'project_created'
  | 'project_deleted'
  | 'alert_triggered';

export const notificationTypeLabels: Record<NotificationType, string> = {
  team_invite: 'Team Invitation',
  team_invite_accepted: 'Invite Accepted',
  team_invite_declined: 'Invite Declined',
  team_invite_cancelled: 'Invite Cancelled',
  member_joined: 'Member Joined',
  member_left: 'Member Left',
  member_removed: 'Member Removed',
  role_changed: 'Role Changed',
  ownership_transferred: 'Ownership Transferred',
  comment_added: 'New Comment',
  comment_replied: 'Reply to Comment',
  webhook_received: 'Webhook Received',
  plan_changed: 'Plan Changed',
  project_created: 'Project Created',
  project_deleted: 'Project Deleted',
  alert_triggered: 'Alert Triggered',
};

const defaultEnabledTypes: NotificationType[] = [
  'team_invite',
  'team_invite_accepted',
  'team_invite_declined',
  'team_invite_cancelled',
  'member_joined',
  'member_left',
  'member_removed',
  'role_changed',
  'ownership_transferred',
  'comment_added',
  'comment_replied',
  'webhook_received',
  'plan_changed',
  'project_created',
  'project_deleted',
  'alert_triggered',
];

export async function seedDefaultPreferences(userId: string) {
  const existing = await prisma.notificationPreference.findMany({
    where: { userId },
    select: { type: true },
  });
  const existingTypes = new Set(existing.map((p) => p.type));
  const missing = defaultEnabledTypes.filter((t) => !existingTypes.has(t));
  if (missing.length > 0) {
    await prisma.notificationPreference.createMany({
      data: missing.map((type) => ({ userId, type, enabled: true })),
      skipDuplicates: true,
    });
  }
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}) {
  // Check preference
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId, type } },
  });

  // If preference doesn't exist, seed defaults first
  if (!pref) {
    await seedDefaultPreferences(userId);
  }

  // Re-check after seeding
  const finalPref = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId, type } },
  });

  if (finalPref && !finalPref.enabled) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ?? {},
    },
  });

  // Push via Socket.IO
  try {
    const io = getIO();
    if (io) {
      const room = `user:${userId}`;
      io.to(room).emit('notification', notification);
      // Also emit unread count update
      const unreadCount = await prisma.notification.count({
        where: { userId, read: false },
      });
      io.to(room).emit('notification_count', unreadCount);
    }
  } catch {
    // Non-critical: if Socket.IO fails, the notif is still in DB
  }

  return notification;
}

export async function notifyTeamAdmins({
  teamId,
  excludeUserId,
  type,
  title,
  message,
  data,
}: {
  teamId: string;
  excludeUserId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}) {
  const members = await prisma.teamMember.findMany({
    where: {
      teamId,
      role: 'ADMIN',
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    select: { userId: true },
  });

  // Also include the owner
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  });

  const recipientIds = new Set(members.map((m) => m.userId));
  if (team?.ownerId && team.ownerId !== excludeUserId) {
    recipientIds.add(team.ownerId);
  }

  for (const userId of recipientIds) {
    await createNotification({ userId, type, title, message, data });
  }
}

export async function notifyTeamMembers({
  teamId,
  excludeUserId,
  type,
  title,
  message,
  data,
}: {
  teamId: string;
  excludeUserId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}) {
  const members = await prisma.teamMember.findMany({
    where: {
      teamId,
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    select: { userId: true },
  });

  for (const member of members) {
    await createNotification({ userId: member.userId, type, title, message, data });
  }
}
