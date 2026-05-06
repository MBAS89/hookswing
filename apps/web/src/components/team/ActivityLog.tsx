import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Loader2, Clock, FolderPlus, FolderPen, FolderX, Play, Trash2, UserPlus, UserCog, UserX, PenLine, ArrowRightLeft, BellPlus, BellOff, ToggleLeft, Globe, FileDown, MessageSquare, MessageSquareOff } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: any;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

const actionIcons: Record<string, React.ElementType> = {
  project_created: FolderPlus,
  project_updated: FolderPen,
  project_deleted: FolderX,
  webhook_replayed: Play,
  webhook_deleted: Trash2,
  member_invited: UserPlus,
  member_role_changed: UserCog,
  member_removed: UserX,
  team_renamed: PenLine,
  team_transferred: ArrowRightLeft,
  alert_added: BellPlus,
  alert_removed: BellOff,
  alert_toggled: ToggleLeft,
  custom_slug_changed: Globe,
  export_downloaded: FileDown,
  comment_added: MessageSquare,
  comment_deleted: MessageSquareOff,
};

const actionLabels: Record<string, string> = {
  project_created: 'created a project',
  project_updated: 'updated a project',
  project_deleted: 'deleted a project',
  webhook_replayed: 'replayed a webhook',
  webhook_deleted: 'deleted a webhook',
  member_invited: 'invited a member',
  member_role_changed: "changed a member's role",
  member_removed: 'removed a member',
  team_renamed: 'renamed the team',
  team_transferred: 'transferred ownership',
  alert_added: 'added an alert',
  alert_removed: 'removed an alert',
  alert_toggled: 'toggled an alert',
  custom_slug_changed: 'changed custom slug',
  export_downloaded: 'downloaded export',
  comment_added: 'added a comment',
  comment_deleted: 'deleted a comment',
};

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString();
}

export default function ActivityLog({ teamId }: { teamId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/teams/${teamId}/activity`)
      .then((res) => setActivities(res.data))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
        <p className="text-xs mt-1">Team actions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((act) => {
        const Icon = actionIcons[act.action] || Clock;
        const label = actionLabels[act.action] || act.action;
        return (
          <div key={act.id} className="flex items-start gap-3 bg-slate-800/50 rounded-lg px-3 py-2.5">
            <div className="mt-0.5 p-1.5 bg-slate-700/50 rounded-md shrink-0">
              <Icon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200">
                <span className="font-medium text-white">{act.user.name || act.user.email}</span>{' '}
                {label}
                {act.metadata?.name && (
                  <span className="text-slate-400"> — {act.metadata.name}</span>
                )}
                {act.metadata?.email && (
                  <span className="text-slate-400"> — {act.metadata.email}</span>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{formatTimeAgo(act.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
