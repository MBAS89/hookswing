import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import ConfirmModal from '../ui/ConfirmModal';
import { Loader2, Clock, FolderPlus, FolderPen, FolderX, Play, Trash2, UserPlus, UserCheck, UserCog, UserX, PenLine, ArrowRightLeft, BellPlus, BellOff, ToggleLeft, Globe, FileDown, MessageSquare, MessageSquareOff, MessageSquareReply, Trash } from 'lucide-react';

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
  member_joined: UserCheck,
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
  comment_replied: MessageSquareReply,
  comment_deleted: MessageSquareOff,
};

const actionLabels: Record<string, string> = {
  project_created: 'created a project',
  project_updated: 'updated a project',
  project_deleted: 'deleted a project',
  webhook_replayed: 'replayed a webhook',
  webhook_deleted: 'deleted a webhook',
  member_invited: 'invited a member',
  member_joined: 'joined the team',
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
  comment_replied: 'replied to a comment',
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

export default function ActivityLog({ teamId, isOwner }: { teamId: string; isOwner: boolean }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);
  const toast = useToast();

  const fetchActivities = () => {
    setLoading(true);
    api.get(`/teams/${teamId}/activity`)
      .then((res) => setActivities(res.data))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivities();
  }, [teamId]);

  const handleClear = async () => {
    try {
      await api.delete(`/teams/${teamId}/activity`);
      setActivities([]);
      setClearConfirm(false);
      toast.success('Activity log cleared');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to clear activity log');
    }
  };

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
        {isOwner && (
          <button
            onClick={() => setClearConfirm(true)}
            className="mt-4 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto"
          >
            <Trash className="w-3 h-3" />
            Clear Activity Log
          </button>
        )}
        <ConfirmModal
          open={clearConfirm}
          title="Clear Activity Log"
          message="Are you sure you want to clear all activity log entries? This cannot be undone."
          confirmLabel="Clear"
          cancelLabel="Cancel"
          danger
          onConfirm={handleClear}
          onCancel={() => setClearConfirm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isOwner && (
        <div className="flex justify-end">
          <button
            onClick={() => setClearConfirm(true)}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <Trash className="w-3 h-3" />
            Clear Activity Log
          </button>
        </div>
      )}
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
                {act.metadata?.projectName && (
                  <span className="text-slate-400"> in {act.metadata.projectName}</span>
                )}
                {act.metadata?.name && !act.metadata?.projectName && (
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
      <ConfirmModal
        open={clearConfirm}
        title="Clear Activity Log"
        message="Are you sure you want to clear all activity log entries? This cannot be undone."
        confirmLabel="Clear"
        cancelLabel="Cancel"
        danger
        onConfirm={handleClear}
        onCancel={() => setClearConfirm(false)}
      />
    </div>
  );
}
