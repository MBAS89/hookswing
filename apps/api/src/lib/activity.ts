import { prisma } from './prisma';

export type ActivityAction =
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'webhook_replayed'
  | 'webhook_deleted'
  | 'member_invited'
  | 'member_role_changed'
  | 'member_removed'
  | 'team_renamed'
  | 'team_transferred'
  | 'alert_added'
  | 'alert_removed'
  | 'alert_toggled'
  | 'custom_slug_changed'
  | 'export_downloaded'
  | 'comment_added'
  | 'comment_replied'
  | 'comment_deleted';

export async function logActivity({
  teamId,
  userId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  teamId: string;
  userId: string;
  action: ActivityAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        teamId,
        userId,
        action,
        targetType,
        targetId,
        metadata: metadata ?? {},
      },
    });
  } catch {
    // Fail silently — activity logging should never break core operations
  }
}

export const actionLabels: Record<ActivityAction, string> = {
  project_created: 'created a project',
  project_updated: 'updated a project',
  project_deleted: 'deleted a project',
  webhook_replayed: 'replayed a webhook',
  webhook_deleted: 'deleted a webhook',
  member_invited: 'invited a member',
  member_role_changed: "changed a member's role",
  member_removed: 'removed a member',
  team_renamed: 'renamed the team',
  team_transferred: 'transferred team ownership',
  alert_added: 'added an alert',
  alert_removed: 'removed an alert',
  alert_toggled: 'toggled an alert',
  custom_slug_changed: 'changed the custom slug',
  export_downloaded: 'downloaded an export',
  comment_added: 'added a comment',
  comment_replied: 'replied to a comment',
  comment_deleted: 'deleted a comment',
};
