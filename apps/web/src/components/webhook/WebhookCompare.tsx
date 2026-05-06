import { X, GitCompare } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface Webhook {
  id: string;
  method: string;
  statusCode: number | null;
  headers: any;
  body: any;
  query: any;
  ip: string;
  source: string | null;
  isReplay: boolean;
  createdAt: string;
  userAgent: string | null;
}

interface WebhookCompareProps {
  left: Webhook;
  right: Webhook;
  onClose: () => void;
}

export default function WebhookCompare({ left, right, onClose }: WebhookCompareProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-xl border border-slate-700 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Compare Requests</h2>
              <p className="text-xs text-slate-400">Side-by-side diff of two webhooks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <ColumnHeader label="Request A" time={left.createdAt} />
              <DiffRow label="Method" left={left.method} right={right.method} />
              <DiffRow label="Status" left={left.statusCode?.toString() || '-'} right={right.statusCode?.toString() || '-'} />
              <DiffRow label="Source" left={left.source || 'Unknown'} right={right.source || 'Unknown'} />
              <DiffRow label="IP" left={left.ip} right={right.ip} />
              <DiffRow label="User Agent" left={left.userAgent || '-'} right={right.userAgent || '-'} />
              <DiffRow label="Replay" left={left.isReplay ? 'Yes' : 'No'} right={right.isReplay ? 'Yes' : 'No'} />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <ColumnHeader label="Request B" time={right.createdAt} />
              <div className="h-6" /> {/* spacer for alignment */}
              <ValueCell value={right.method} compare={left.method} />
              <ValueCell value={right.statusCode?.toString() || '-'} compare={left.statusCode?.toString() || '-'} />
              <ValueCell value={right.source || 'Unknown'} compare={left.source || 'Unknown'} />
              <ValueCell value={right.ip} compare={left.ip} />
              <ValueCell value={right.userAgent || '-'} compare={left.userAgent || '-'} />
              <ValueCell value={right.isReplay ? 'Yes' : 'No'} compare={left.isReplay ? 'Yes' : 'No'} />
            </div>
          </div>

          {/* Headers Diff */}
          <SectionTitle title="Headers" />
          <div className="grid grid-cols-2 gap-4">
            <ObjectDiffTable obj={left.headers || {}} compare={right.headers || {}} />
            <ObjectDiffTable obj={right.headers || {}} compare={left.headers || {}} reverse />
          </div>

          {/* Query Diff */}
          {(left.query || right.query) && (
            <>
              <SectionTitle title="Query Parameters" />
              <div className="grid grid-cols-2 gap-4">
                <ObjectDiffTable obj={left.query || {}} compare={right.query || {}} />
                <ObjectDiffTable obj={right.query || {}} compare={left.query || {}} reverse />
              </div>
            </>
          )}

          {/* Body Diff */}
          <SectionTitle title="Body" />
          <div className="grid grid-cols-2 gap-4">
            <BodyDiff body={left.body} compare={right.body} />
            <BodyDiff body={right.body} compare={left.body} reverse />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColumnHeader({ label, time }: { label: string; time: string }) {
  return (
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
      <span>{label}</span>
      <span className="text-slate-600 font-normal">{formatDate(time)}</span>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

function DiffRow({ label, left, right }: { label: string; left: string; right: string }) {
  const isDiff = left !== right;
  return (
    <div>
      <span className="text-xs text-slate-500 block mb-1">{label}</span>
      <span className={`text-sm font-medium px-2 py-1 rounded ${isDiff ? 'bg-red-500/10 text-red-400' : 'text-white'}`}>
        {left}
      </span>
    </div>
  );
}

function ValueCell({ value, compare }: { value: string; compare: string }) {
  const isDiff = value !== compare;
  return (
    <div>
      <span className="text-xs text-slate-500 block mb-1 opacity-0">spacer</span>
      <span className={`text-sm font-medium px-2 py-1 rounded ${isDiff ? 'bg-emerald-500/10 text-emerald-400' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function ObjectDiffTable({ obj, compare, reverse }: { obj: Record<string, any>; compare: Record<string, any>; reverse?: boolean }) {
  const keys = new Set([...Object.keys(obj), ...Object.keys(compare)]);
  const sortedKeys = Array.from(keys).sort();

  return (
    <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
      <table className="w-full text-xs">
        <tbody className="divide-y divide-slate-800">
          {sortedKeys.map((key) => {
            const val = obj[key];
            const otherVal = compare[key];
            const hasDiff = JSON.stringify(val) !== JSON.stringify(otherVal);
            const isMissing = !(key in obj);
            const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');

            return (
              <tr key={key} className={isMissing ? 'opacity-40' : ''}>
                <td className="px-3 py-1.5 text-slate-500 font-mono w-1/3 border-r border-slate-800">{key}</td>
                <td className={`px-3 py-1.5 font-mono break-all ${
                  hasDiff && !reverse ? 'bg-red-500/5 text-red-300' :
                  hasDiff && reverse ? 'bg-emerald-500/5 text-emerald-300' :
                  'text-slate-300'
                }`}>
                  {valStr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BodyDiff({ body, compare, reverse }: { body: any; compare: any; reverse?: boolean }) {
  if (!body && !compare) {
    return (
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4">
        <p className="text-xs text-slate-500 text-center">No body</p>
      </div>
    );
  }

  // If both are objects, do structured diff
  if (typeof body === 'object' && body !== null && typeof compare === 'object' && compare !== null) {
    return (
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 overflow-auto max-h-80">
        <pre className="text-xs font-mono">
          <JsonDiffNode node={body} compare={compare} reverse={reverse} />
        </pre>
      </div>
    );
  }

  // String diff
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
  const compareStr = typeof compare === 'string' ? compare : JSON.stringify(compare, null, 2);
  const isDiff = bodyStr !== compareStr;

  return (
    <div className={`bg-slate-950 rounded-lg border border-slate-800 p-3 overflow-auto max-h-80 ${
      isDiff && !reverse ? 'bg-red-500/5 border-red-500/20' :
      isDiff && reverse ? 'bg-emerald-500/5 border-emerald-500/20' : ''
    }`}>
      <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{bodyStr}</pre>
    </div>
  );
}

function JsonDiffNode({ node, compare, reverse, indent = 0 }: { node: any; compare: any; reverse?: boolean; indent?: number }) {
  const prefix = '  '.repeat(indent);

  if (node === null || node === undefined) {
    return <span className="text-slate-500">null</span>;
  }

  if (typeof node !== 'object') {
    const isDiff = JSON.stringify(node) !== JSON.stringify(compare);
    return (
      <span className={isDiff ? (reverse ? 'text-emerald-400' : 'text-red-400') : 'text-slate-300'}>
        {JSON.stringify(node)}
      </span>
    );
  }

  if (Array.isArray(node)) {
    return (
      <>
        <span className="text-slate-500">{'[\n'}</span>
        {node.map((item, i) => (
          <div key={i}>
            {prefix}{'  '}
            <JsonDiffNode node={item} compare={compare?.[i]} reverse={reverse} indent={indent + 1} />
            <span className="text-slate-500">{i < node.length - 1 ? ',' : ''}</span>
          </div>
        ))}
        <span className="text-slate-500">{prefix}{']'}</span>
      </>
    );
  }

  const keys = Object.keys(node);
  return (
    <>
      <span className="text-slate-500">{'{\n'}</span>
      {keys.map((key, i) => {
        const isDiff = JSON.stringify(node[key]) !== JSON.stringify(compare?.[key]);
        return (
          <div key={key}>
            {prefix}{'  '}
            <span className={isDiff ? (reverse ? 'text-emerald-300' : 'text-red-300') : 'text-sky-400'}>
              "{key}"</span>
            <span className="text-slate-500">: </span>
            <JsonDiffNode node={node[key]} compare={compare?.[key]} reverse={reverse} indent={indent + 1} />
            <span className="text-slate-500">{i < keys.length - 1 ? ',' : ''}</span>
          </div>
        );
      })}
      <span className="text-slate-500">{prefix}{'}'}</span>
    </>
  );
}
