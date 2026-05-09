import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDiscussion, DiscussionComment } from '../../hooks/useDiscussion';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  Trash2,
  ArrowRight,
  Clock,
  Loader2,
  Send,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString();
}

function avatarColor(id: string) {
  const colors = ['bg-red-500','bg-orange-500','bg-amber-500','bg-green-500','bg-emerald-500','bg-teal-500','bg-cyan-500','bg-sky-500','bg-blue-500','bg-indigo-500','bg-violet-500','bg-purple-500','bg-fuchsia-500','bg-pink-500','bg-rose-500'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function UserAvatar({ user, size = 'sm' }: { user: { name: string | null; email: string }; size?: 'sm' | 'md' }) {
  const initials = (user.name || user.email)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const cls = size === 'md' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]';
  return (
    <div className={`${cls} ${avatarColor(user.email)} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function CommentItem({
  comment,
  depth = 0,
  onReply,
  onReact,
  onDelete,
  currentUserId,
  teamId,
}: {
  comment: DiscussionComment;
  depth?: number;
  onReply: (webhookId: string, content: string, parentId: string) => void;
  onReact: (commentId: string, type: 'like' | 'dislike') => void;
  onDelete: (webhookId: string, commentId: string) => void;
  currentUserId: string;
  teamId: string;
}) {
  const navigate = useNavigate();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showAllReplies, setShowAllReplies] = useState(false);
  const isMine = comment.user.id === currentUserId;

  const visibleReplies = comment.replies || [];
  const totalReplies = comment._count?.replies ?? visibleReplies.length;

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.webhook.id, replyText.trim(), comment.id);
    setReplyText('');
    setShowReply(false);
  };

  const viewWebhook = () => {
    navigate(`/dashboard/project/${comment.webhook.projectId}?webhook=${comment.webhook.id}&tab=comments`);
  };

  return (
    <div className={`${depth > 0 ? 'ml-10 pl-4 border-l-2 border-white/5' : ''}`}>
      <div className="flex gap-3 group">
        <UserAvatar user={comment.user} size={depth === 0 ? 'md' : 'sm'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{comment.user.name || comment.user.email.split('@')[0]}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />{relativeTime(comment.createdAt)}
            </span>
            {depth === 0 && (
              <button
                onClick={viewWebhook}
                className="ml-auto text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                View webhook <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="mt-1 text-sm text-slate-200 whitespace-pre-wrap break-words">{comment.content}</div>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onReact(comment.id, 'like')}
              className={`flex items-center gap-1 text-xs transition-colors ${comment.userReaction === 'like' ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />{comment.likes || 0}
            </button>
            <button
              onClick={() => onReact(comment.id, 'dislike')}
              className={`flex items-center gap-1 text-xs transition-colors ${comment.userReaction === 'dislike' ? 'text-rose-400' : 'text-slate-500 hover:text-rose-400'}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />{comment.dislikes || 0}
            </button>
            <button
              onClick={() => setShowReply((s) => !s)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-400 transition-colors"
            >
              <CornerDownRight className="w-3.5 h-3.5" />Reply
            </button>
            {isMine && (
              <button
                onClick={() => onDelete(comment.webhook.id, comment.id)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />Delete
              </button>
            )}
          </div>

          {showReply && (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                placeholder="Write a reply..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 py-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {visibleReplies.length > 0 && (
        <div className="mt-3 space-y-3">
          {visibleReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onReact={onReact}
              onDelete={onDelete}
              currentUserId={currentUserId}
              teamId={teamId}
            />
          ))}
          {totalReplies > visibleReplies.length && !showAllReplies && (
            <button
              onClick={() => setShowAllReplies(true)}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 ml-10"
            >
              <ChevronDown className="w-3 h-3" />
              Show {totalReplies - visibleReplies.length} more {totalReplies - visibleReplies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function DiscussionFeed({ teamId }: { teamId: string }) {
  const { comments, loading, fetchComments, addReply, react, deleteComment } = useDiscussion(teamId);
  const { user } = useAuth();
  const toast = useToast();

  const grouped = useMemo(() => {
    const map: Record<string, DiscussionComment[]> = {};
    for (const c of comments) {
      const key = c.projectName;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [comments]);

  const handleReply = async (webhookId: string, content: string, parentId?: string) => {
    try {
      await addReply(webhookId, content, parentId);
    } catch {
      toast.error('Failed to post reply');
    }
  };

  const handleReact = async (commentId: string, type: 'like' | 'dislike') => {
    try {
      await react(commentId, type);
    } catch {
      toast.error('Failed to react');
    }
  };

  const handleDelete = async (webhookId: string, commentId: string) => {
    try {
      await deleteComment(webhookId, commentId);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading discussions...
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm">No discussions yet</p>
        <p className="text-xs mt-1 opacity-60">Comments on webhooks will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([projectName, projectComments]) => (
        <div key={projectName}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded">{projectName}</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="space-y-5">
            {projectComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onReact={handleReact}
                onDelete={handleDelete}
                currentUserId={user!.id}
                teamId={teamId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
