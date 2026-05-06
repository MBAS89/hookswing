export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'POST': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'PUT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'PATCH': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export function statusColor(status: number | null): string {
  if (!status) return 'bg-slate-500';
  if (status >= 200 && status < 300) return 'bg-emerald-500';
  if (status >= 400 && status < 500) return 'bg-amber-500';
  if (status >= 500) return 'bg-red-500';
  return 'bg-slate-500';
}
