import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebhooks } from '../hooks/useWebhooks';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import WebhookCard from '../components/webhook/WebhookCard';
import WebhookDetail from '../components/webhook/WebhookDetail';
import WebhookCompare from '../components/webhook/WebhookCompare';
import {
  Loader2, RefreshCw, Filter, Trash2, Copy, Check, SatelliteDish,
  Edit3, X, Globe, Crown, Bell, MessageSquare, ToggleLeft, ToggleRight, Send,
  GitCompare, FileDown, ChevronDown, ChevronUp, Shield,
} from 'lucide-react';
import { api } from '../lib/api';

interface Project {
  id: string;
  name: string;
  slug: string;
  customSlug: string | null;
  description: string | null;
  webhookUrl: string;
  webhookCount: number;
  historyLimitDays: number | null;
  teamId?: string | null;
  isTeamAdmin?: boolean;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { webhooks, loading, fetchWebhooks, addWebhook, deleteWebhook, replayWebhook } = useWebhooks(id || null);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [filterMethod, setFilterMethod] = useState('');

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [compareWebhooks, setCompareWebhooks] = useState<[any, any] | null>(null);

  const isTeamProject = !!project?.teamId;
  const hasProFeatures = user?.plan === 'PRO' || user?.plan === 'TEAM' || isTeamProject;
  const hasTeamFeatures = user?.plan === 'TEAM' || isTeamProject;
  const canCompare = hasProFeatures;
  const canReplay = hasProFeatures;

  // Custom slug editing
  const [editingSlug, setEditingSlug] = useState(false);
  const [customSlugInput, setCustomSlugInput] = useState('');
  const [slugError, setSlugError] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<Array<{ id: string; type: string; url: string; enabled: boolean; config?: any }>>([]);
  const [canUseAlerts, setCanUseAlerts] = useState(false);
  const [canManageAlerts, setCanManageAlerts] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [alertType, setAlertType] = useState<'slack' | 'discord' | 'telegram'>('slack');
  const [alertUrl, setAlertUrl] = useState('');
  const [alertBotToken, setAlertBotToken] = useState('');
  const [alertChatId, setAlertChatId] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);

  const canUseCustomSlug = hasProFeatures;
  const canEditProject = !isTeamProject || project?.isTeamAdmin;

  const fetchAlerts = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/projects/${id}/alerts`);
      setAlerts(res.data.alerts);
      setCanUseAlerts(res.data.canUseAlerts);
      setCanManageAlerts(res.data.canManageAlerts);
    } catch {
      setAlerts([]);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setProjectLoading(true);
    api.get(`/projects/${id}`)
      .then((res) => {
        setProject(res.data);
        setCustomSlugInput(res.data.customSlug || '');
      })
      .catch(() => setProject(null))
      .finally(() => setProjectLoading(false));
    fetchAlerts();
  }, [id, fetchAlerts]);

  useSocket(id || null, useCallback((webhook) => {
    addWebhook(webhook);
  }, [addWebhook]));

  const handleBulkDelete = async () => {
    if (!confirm('Delete all webhooks in this project?')) return;
    await api.post(`/webhooks/projects/${id}/webhooks/bulk-delete`);
    fetchWebhooks();
    setSelectedWebhook(null);
  };

  const copyUrl = () => {
    if (!project?.webhookUrl) return;
    navigator.clipboard.writeText(project.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCompare = (webhookId: string) => {
    if (!canCompare) return;
    setCompareSelection((prev) => {
      if (prev.includes(webhookId)) {
        return prev.filter((id) => id !== webhookId);
      }
      if (prev.length >= 2) {
        return [prev[1], webhookId];
      }
      return [...prev, webhookId];
    });
  };

  useEffect(() => {
    if (compareSelection.length === 2) {
      const left = webhooks.find((w) => w.id === compareSelection[0]);
      const right = webhooks.find((w) => w.id === compareSelection[1]);
      if (left && right) {
        setCompareWebhooks([left, right]);
        setCompareMode(false);
        setCompareSelection([]);
      }
    }
  }, [compareSelection, webhooks]);

  const saveCustomSlug = async () => {
    if (!project) return;
    setSlugError('');
    setSavingSlug(true);
    try {
      const value = customSlugInput.trim() || null;
      const res = await api.patch(`/projects/${project.id}`, { customSlug: value });
      setProject({ ...project, customSlug: res.data.customSlug, webhookUrl: res.data.customSlug ? project.webhookUrl.replace(project.slug, res.data.customSlug) : project.webhookUrl });
      setEditingSlug(false);
    } catch (err: any) {
      setSlugError(err.response?.data?.error || 'Failed to update');
    } finally {
      setSavingSlug(false);
    }
  };

  // Project rename
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editDescValue, setEditDescValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const saveProjectName = async () => {
    if (!project) return;
    setNameError('');
    setSavingName(true);
    try {
      const res = await api.patch(`/projects/${project.id}`, {
        name: editNameValue.trim(),
        description: editDescValue.trim() || null,
      });
      setProject({ ...project, name: res.data.name, description: res.data.description });
      setEditingName(false);
    } catch (err: any) {
      setNameError(err.response?.data?.error || 'Failed to update');
    } finally {
      setSavingName(false);
    }
  };

  const exportWebhooks = async (format: 'json' | 'csv') => {
    if (!id) return;
    try {
      const res = await api.get(`/webhooks/projects/${id}/export/${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'webhooks'}-webhooks.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Export failed');
    }
  };

  const addAlert = async () => {
    if (!id) return;
    setAlertLoading(true);
    try {
      const payload: any = { type: alertType };
      if (alertType === 'telegram') {
        payload.botToken = alertBotToken.trim();
        payload.chatId = alertChatId.trim();
      } else {
        payload.url = alertUrl.trim();
      }
      await api.post(`/projects/${id}/alerts`, payload);
      setAlertUrl('');
      setAlertBotToken('');
      setAlertChatId('');
      setShowAlertForm(false);
      fetchAlerts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add alert');
    } finally {
      setAlertLoading(false);
    }
  };

  const toggleAlert = async (alertId: string, enabled: boolean) => {
    try {
      await api.patch(`/projects/${id}/alerts/${alertId}`, { enabled: !enabled });
      fetchAlerts();
    } catch {
      alert('Failed to toggle alert');
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Delete this alert?')) return;
    try {
      await api.delete(`/projects/${id}/alerts/${alertId}`);
      fetchAlerts();
    } catch {
      alert('Failed to delete alert');
    }
  };

  const filtered = filterMethod
    ? webhooks.filter((w) => w.method.toUpperCase() === filterMethod)
    : webhooks;

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    placeholder="Project name"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={saveProjectName}
                    disabled={savingName || !editNameValue.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameError(''); }}
                    className="text-slate-400 hover:text-white p-1.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={editDescValue}
                  onChange={(e) => setEditDescValue(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {nameError && <p className="text-xs text-red-400">{nameError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-white">{project?.name || 'Project'}</h1>
                  {project?.description && (
                    <p className="text-sm text-slate-400 mt-0.5">{project.description}</p>
                  )}
                </div>
                {canEditProject && (
                  <button
                    onClick={() => { setEditingName(true); setEditNameValue(project?.name || ''); setEditDescValue(project?.description || ''); }}
                    className="text-slate-500 hover:text-white transition-colors shrink-0"
                    title="Rename project"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Webhooks this month</p>
              <p className="text-xl font-bold text-white">{project?.webhookCount || 0}</p>
              {project?.historyLimitDays && (
                <p className="text-xs text-amber-400 mt-0.5">{project.historyLimitDays}-day history</p>
              )}
              {project?.historyLimitDays === null && (
                <p className="text-xs text-emerald-400 mt-0.5">Unlimited history</p>
              )}
            </div>
            <button
              onClick={() => setHeaderCollapsed(!headerCollapsed)}
              className="mt-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
              title={headerCollapsed ? 'Expand' : 'Collapse'}
            >
              {headerCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!headerCollapsed && (
          <>
            {/* Webhook URL */}
        {project?.webhookUrl && (
          <div className="mt-4">
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">
              Your Webhook URL — paste this into Stripe, GitHub, etc.
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 flex items-center gap-3">
                <SatelliteDish className="w-4 h-4 text-emerald-400 shrink-0" />
                <code className="text-sm text-emerald-400 font-mono truncate">{project.webhookUrl}</code>
              </div>
              <button
                onClick={copyUrl}
                className="shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Alerts */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-white">Alerts</span>
              {alerts.length > 0 && (
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">{alerts.length}</span>
              )}
            </div>
            {canManageAlerts ? (
              <button
                onClick={() => setShowAlertForm(!showAlertForm)}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors"
              >
                <Bell className="w-3 h-3" />
                {showAlertForm ? 'Cancel' : 'Add Alert'}
              </button>
            ) : isTeamProject ? (
              <span className="text-xs flex items-center gap-1 text-slate-500 bg-slate-800 px-2.5 py-1 rounded-md" title="Only team admins can manage alerts">
                <Shield className="w-3 h-3" />
                Admin only
              </span>
            ) : (
              <span className="text-xs flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                <Crown className="w-3 h-3" />
                Pro/Team only
              </span>
            )}
          </div>

          {showAlertForm && (
            <div className="bg-slate-800 rounded-lg p-3 mb-2 space-y-2">
              <div className="flex gap-2">
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as 'slack' | 'discord' | 'telegram')}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm shrink-0"
                >
                  <option value="slack">Slack</option>
                  <option value="discord">Discord</option>
                  <option value="telegram">Telegram</option>
                </select>
                {alertType === 'telegram' ? (
                  <>
                    <input
                      type="text"
                      value={alertBotToken}
                      onChange={(e) => setAlertBotToken(e.target.value)}
                      placeholder="Bot Token (from @BotFather)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      value={alertChatId}
                      onChange={(e) => setAlertChatId(e.target.value)}
                      placeholder="Chat ID"
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </>
                ) : (
                  <input
                    type="url"
                    value={alertUrl}
                    onChange={(e) => setAlertUrl(e.target.value)}
                    placeholder={alertType === 'slack' ? 'https://hooks.slack.com/services/...' : 'https://discord.com/api/webhooks/...'}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                )}
                <button
                  onClick={addAlert}
                  disabled={alertLoading || (alertType === 'telegram' ? (!alertBotToken.trim() || !alertChatId.trim()) : !alertUrl.trim())}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 shrink-0"
                >
                  {alertLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {alertType === 'slack' && 'Paste your Slack Incoming Webhook URL here.'}
                {alertType === 'discord' && 'Paste your Discord Webhook URL here.'}
                {alertType === 'telegram' && 'Get your Bot Token from @BotFather and Chat ID from @userinfobot.'}
              </p>
            </div>
          )}

          {alerts.length === 0 && !showAlertForm && (
            <p className="text-xs text-slate-600">No alerts configured. Add one to get notified on every webhook.</p>
          )}

          <div className="space-y-1.5">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  {alert.type === 'slack' && <MessageSquare className="w-4 h-4 text-purple-400" />}
                  {alert.type === 'discord' && <MessageSquare className="w-4 h-4 text-indigo-400" />}
                  {alert.type === 'telegram' && <Send className="w-4 h-4 text-sky-400" />}
                  <span className="text-sm text-white capitalize">{alert.type}</span>
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">
                    {alert.type === 'telegram' ? `Chat: ${alert.config?.chatId || '...'}` : alert.url}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {canManageAlerts ? (
                    <>
                      <button
                        onClick={() => toggleAlert(alert.id, alert.enabled)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title={alert.enabled ? 'Disable' : 'Enable'}
                      >
                        {alert.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${alert.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {alert.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Slug */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          {editingSlug ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-400">{window.location.origin}/hook/</span>
                  <input
                    type="text"
                    value={customSlugInput}
                    onChange={(e) => setCustomSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="my-company"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    autoFocus
                  />
                </div>
                {slugError && <p className="text-xs text-red-400 mt-1 ml-6">{slugError}</p>}
              </div>
              <button
                onClick={saveCustomSlug}
                disabled={savingSlug}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {savingSlug ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
              <button
                onClick={() => { setEditingSlug(false); setSlugError(''); setCustomSlugInput(project?.customSlug || ''); }}
                className="text-slate-400 hover:text-white p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">Custom subdomain:</span>
                {project?.customSlug ? (
                  <code className="text-sm text-emerald-400 font-mono">{project.customSlug}</code>
                ) : (
                  <span className="text-sm text-slate-600">Not set</span>
                )}
              </div>
              {canEditProject ? (
                <button
                  onClick={() => setEditingSlug(true)}
                  className="text-xs flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  {project?.customSlug ? 'Edit' : 'Set custom'}
                </button>
              ) : isTeamProject ? (
                <span className="text-xs flex items-center gap-1 text-slate-500 bg-slate-800 px-2.5 py-1 rounded-md" title="Only team admins can change the custom slug">
                  <Shield className="w-3 h-3" />
                  Admin only
                </span>
              ) : (
                <span className="text-xs flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                  <Crown className="w-3 h-3" />
                  Pro/Team only
                </span>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* Webhook Feed */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Webhook Feed</h2>
          {project?.historyLimitDays && (
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {project.historyLimitDays}-day history
            </span>
          )}
          {project?.historyLimitDays === null && (
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Unlimited history
            </span>
          )}
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
            {filtered.length} webhooks
          </span>
        </div>
        <div className="flex items-center gap-2">
          {compareMode && (
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full animate-pulse">
              Select 2 webhooks to compare
            </span>
          )}
          {canCompare && (
            <button
              onClick={() => {
                setCompareMode(!compareMode);
                setCompareSelection([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                compareMode
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              {compareMode ? 'Cancel' : 'Compare'}
            </button>
          )}
          {canReplay ? (
            <>
              <button
                onClick={() => exportWebhooks('json')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs font-medium border border-slate-700"
                title="Export JSON"
              >
                <FileDown className="w-3.5 h-3.5" />
                JSON
              </button>
              <button
                onClick={() => exportWebhooks('csv')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs font-medium border border-slate-700"
                title="Export CSV"
              >
                <FileDown className="w-3.5 h-3.5" />
                CSV
              </button>
            </>
          ) : (
            <span className="text-xs flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
              <Crown className="w-3 h-3" />
              Export: Pro/Team
            </span>
          )}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <button
            onClick={() => fetchWebhooks()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleBulkDelete}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <p>No webhooks yet</p>
              <p className="text-sm mt-1">Send a test request to your URL above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((webhook) => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  selected={selectedWebhook?.id === webhook.id}
                  onClick={() => {
                    if (compareMode) {
                      toggleCompare(webhook.id);
                    } else {
                      setSelectedWebhook(webhook);
                    }
                  }}
                  onCompare={canCompare ? () => toggleCompare(webhook.id) : undefined}
                  compareMode={compareMode}
                  isCompareSelected={compareSelection.includes(webhook.id)}
                />
              ))}
            </div>
          )}
        </div>

        {selectedWebhook && (
          <WebhookDetail
            webhook={selectedWebhook}
            onClose={() => setSelectedWebhook(null)}
            onDelete={(id) => { deleteWebhook(id); setSelectedWebhook(null); }}
            onReplay={async (id, url) => {
              try {
                await replayWebhook(id, url);
              } catch (err: any) {
                alert(err.message || 'Replay failed');
              }
            }}
            canReplay={canReplay}
            isTeamProject={isTeamProject}
          />
        )}
      </div>

      {compareWebhooks && (
        <WebhookCompare
          left={compareWebhooks[0]}
          right={compareWebhooks[1]}
          onClose={() => setCompareWebhooks(null)}
        />
      )}
    </div>
  );
}
