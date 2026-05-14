import { methodColor, statusColor, formatDate, formatBytes } from '../../lib/utils';
import { GitCompare, MessageSquare } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface Webhook {
  id: string;
  method: string;
  headers: any;
  body: any;
  rawBody?: string | null;
  query: any;
  ip: string;
  userAgent: string | null;
  source: string | null;
  statusCode: number | null;
  responseTime: number | null;
  isReplay: boolean;
  originalId: string | null;
  createdAt: string;
  _count?: { comments: number };
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
  const { t } = useTranslation();
  const bodySize = webhook.body ? JSON.stringify(webhook.body).length : 0;
  const commentCount = webhook._count?.comments ?? 0;

  return (
    <div className={`rounded-lg border transition-all ${selected ? 'bg-emerald-500/5 border-emerald-500/30' : isCompareSelected ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'}`}>
      <button onClick={onClick} className="w-full text-left p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${methodColor(webhook.method)}`}>{webhook.method}</span>
          {webhook.statusCode && <span className={`w-2 h-2 rounded-full ${statusColor(webhook.statusCode)}`} />}
          {webhook.isReplay && <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{t('webhook.replay')}</span>}
          <span className="text-xs text-slate-500 ml-auto">{formatDate(webhook.createdAt)}</span>
          {onCompare && (
            <span onClick={(e) => { e.stopPropagation(); onCompare(); }} className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${isCompareSelected ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : compareMode ? 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300 hover:bg-slate-700'}`} title={t('webhook.selectForCompare')}>
              <GitCompare className="w-3 h-3" />{compareMode ? t('webhook.pick') : t('webhook.diff')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span>{webhook.source || t('webhook.custom')}</span><span className="hidden sm:inline">•</span><span>{formatBytes(bodySize)}</span><span className="hidden sm:inline">•</span><span className="font-mono">{webhook.ip}</span>
          {webhook.statusCode && <><span className="hidden sm:inline">•</span><span className={`font-mono ${webhook.statusCode >= 200 && webhook.statusCode < 300 ? 'text-emerald-400' : webhook.statusCode >= 400 ? 'text-red-400' : 'text-amber-400'}`}>{webhook.statusCode}</span></>}
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-white bg-sky-500 px-2 py-0.5 rounded-full shadow-sm shadow-sky-500/20">
              <MessageSquare className="w-3.5 h-3.5 fill-white/20" />{commentCount}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
