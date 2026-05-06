import { methodColor, statusColor, formatDate, formatBytes } from '../../lib/utils';
import { GitCompare } from 'lucide-react';

interface Webhook {
  id: string;
  method: string;
  statusCode: number | null;
  body: any;
  ip: string;
  source: string | null;
  isReplay: boolean;
  createdAt: string;
}

export default function WebhookCard({
  webhook,
  selected,
  onClick,
  onCompare,
  compareMode,
  isCompareSelected,
}: {
  webhook: Webhook;
  selected: boolean;
  onClick: () => void;
  onCompare?: () => void;
  compareMode?: boolean;
  isCompareSelected?: boolean;
}) {
  const bodySize = webhook.body ? JSON.stringify(webhook.body).length : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        selected
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : isCompareSelected
          ? 'bg-amber-500/5 border-amber-500/30'
          : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${methodColor(webhook.method)}`}>
          {webhook.method}
        </span>
        {webhook.statusCode && (
          <span className={`w-2 h-2 rounded-full ${statusColor(webhook.statusCode)}`} />
        )}
        {webhook.isReplay && (
          <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">REPLAY</span>
        )}

        <span className="text-xs text-slate-500 ml-auto">{formatDate(webhook.createdAt)}</span>

        {onCompare && (
          <span
            onClick={(e) => { e.stopPropagation(); onCompare(); }}
            className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
              isCompareSelected
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : compareMode
                ? 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300 hover:bg-slate-700'
            }`}
            title="Select for compare"
          >
            <GitCompare className="w-3 h-3" />
            {compareMode ? 'Pick' : 'Diff'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>{webhook.source || 'custom'}</span>
        <span>•</span>
        <span>{formatBytes(bodySize)}</span>
        <span>•</span>
        <span className="font-mono">{webhook.ip}</span>
      </div>
    </button>
  );
}
