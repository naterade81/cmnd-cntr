'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Link2 } from 'lucide-react';

export default function IntegrationsPage() {
  const [clickupToken, setClickupToken] = useState('');
  const [clickupStatus, setClickupStatus] = useState<'idle' | 'saving' | 'syncing' | 'success' | 'error'>('idle');
  const [syncResult, setSyncResult] = useState('');

  async function saveClickUpToken() {
    if (!clickupToken.trim()) return;
    setClickupStatus('saving');
    try {
      await fetch('/api/clickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_token', token: clickupToken.trim() }),
      });
      setClickupStatus('success');
      setSyncResult('Token saved successfully');
    } catch {
      setClickupStatus('error');
      setSyncResult('Failed to save token');
    }
  }

  async function syncClickUp() {
    setClickupStatus('syncing');
    try {
      const res = await fetch('/api/clickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      const data = await res.json();
      if (data.error) {
        setClickupStatus('error');
        setSyncResult(data.error);
      } else {
        setClickupStatus('success');
        setSyncResult(`Synced ${data.synced} tasks from ClickUp`);
      }
    } catch {
      setClickupStatus('error');
      setSyncResult('Sync failed');
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-text-primary">Integrations</h2>

      {/* ClickUp */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-magenta rounded-lg flex items-center justify-center">
            <Link2 size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-text-primary">ClickUp</h3>
            <p className="text-text-muted text-xs font-body">Sync tasks from your ClickUp workspace</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-display uppercase tracking-wider">API Token</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={clickupToken}
                onChange={(e) => setClickupToken(e.target.value)}
                placeholder="pk_..."
                className="flex-1 bg-surface-primary border border-surface-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted font-mono focus:outline-none focus:border-brand-purple/50"
              />
              <button
                onClick={saveClickUpToken}
                disabled={!clickupToken.trim() || clickupStatus === 'saving'}
                className="px-4 py-2.5 bg-brand-purple hover:bg-brand-magenta disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors font-body"
              >
                Save
              </button>
            </div>
            <p className="text-text-muted text-xs mt-1.5 font-body">
              Find your token in ClickUp Settings &gt; Apps
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={syncClickUp}
              disabled={clickupStatus === 'syncing'}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-primary border border-surface-border hover:border-brand-purple/50 text-text-primary rounded-lg text-sm font-body transition-colors"
            >
              <RefreshCw size={16} className={clickupStatus === 'syncing' ? 'animate-spin' : ''} />
              {clickupStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </button>

            {syncResult && (
              <div className="flex items-center gap-2 text-sm font-body">
                {clickupStatus === 'success' ? (
                  <CheckCircle2 size={16} className="text-brand-green" />
                ) : (
                  <AlertCircle size={16} className="text-brand-red" />
                )}
                <span className={clickupStatus === 'success' ? 'text-brand-green' : 'text-brand-red'}>
                  {syncResult}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Calendar — placeholder */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-cyan to-brand-green rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-display font-semibold text-text-primary">Google Calendar</h3>
            <p className="text-text-muted text-xs font-body">View your calendar events in the dashboard</p>
          </div>
        </div>
        <p className="text-text-muted text-sm font-body">
          Google Calendar integration is available via the Claude Code MCP connection. Events will appear in the Calendar view when connected.
        </p>
      </div>
    </div>
  );
}
