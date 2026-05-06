import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

function JsonNode({ data, name, depth = 0 }: { data: any; name?: string; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);

  if (!isObject) {
    let color = 'text-slate-300';
    if (typeof data === 'string') color = 'text-emerald-400';
    if (typeof data === 'number') color = 'text-amber-400';
    if (typeof data === 'boolean') color = 'text-purple-400';
    if (data === null) color = 'text-slate-500';

    return (
      <div className="flex items-start gap-1">
        {name !== undefined && <span className="text-blue-400 shrink-0">"{name}": </span>}
        <span className={color}>{JSON.stringify(data)}</span>
      </div>
    );
  }

  const entries = isArray ? data.map((v: any, i: number) => [i, v]) : Object.entries(data);
  const isEmpty = entries.length === 0;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  return (
    <div>
      <div className="flex items-center gap-1">
        {entries.length > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-slate-300">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
        {name !== undefined && <span className="text-blue-400">"{name}": </span>}
        <span className="text-slate-300">{openBracket}</span>
        {!expanded && !isEmpty && (
          <span className="text-slate-500 text-xs">{entries.length} items...</span>
        )}
        {!expanded && <span className="text-slate-300">{closeBracket}</span>}
      </div>
      {expanded && (
        <div className="ml-4 border-l border-slate-700 pl-2">
          {entries.map((entry: any[]) => (
            <JsonNode key={entry[0]} data={entry[1]} name={isArray ? undefined : entry[0]} depth={depth + 1} />
          ))}
          <span className="text-slate-300">{closeBracket}</span>
        </div>
      )}
    </div>
  );
}

export default function JsonViewer({ data }: { data: any }) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 overflow-auto max-h-96 font-mono text-sm">
      <JsonNode data={data} />
    </div>
  );
}
