'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle2, UserPlus, Copy, Trash2, Users, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface FamilyMember {
  id: number;
  name: string;
  display_name: string;
  role: string;
  avatar_color: string;
  created_at: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then(setSettings);
    if (isAdmin) {
      fetch('/api/admin/users').then((r) => r.json()).then(setMembers);
    }
  }, [isAdmin]);

  async function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function generateInvite() {
    const res = await fetch('/api/auth/invite', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setInviteUrl(data.url);
    }
  }

  function copyInvite() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(inviteUrl);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = inviteUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function removeMember(id: number) {
    if (!confirm('Remove this family member? Their data will be deleted.')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMembers(members.filter((m) => m.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl md:text-2xl font-bold text-text-primary">Settings</h2>

      {/* Family Management (Admin only) */}
      {isAdmin && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-6">
          <div>
            <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users size={16} />
              Family Members
            </h3>
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold font-display"
                      style={{ backgroundColor: m.avatar_color }}
                    >
                      {m.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-body">{m.display_name}</p>
                      <p className="text-text-muted text-xs font-mono">@{m.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      m.role === 'admin' ? 'bg-brand-amber/15 text-brand-amber' : 'bg-surface-primary text-text-muted'
                    }`}>
                      {m.role === 'admin' && <Shield size={10} className="inline mr-1" />}
                      {m.role}
                    </span>
                    {m.id !== user?.id && (
                      <button
                        onClick={() => removeMember(m.id)}
                        className="p-1.5 text-text-muted hover:text-brand-red transition-colors"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-surface-border pt-6">
            <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus size={16} />
              Invite Family Member
            </h3>
            {inviteUrl ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 bg-surface-primary border border-surface-border rounded-lg px-4 py-2.5 text-sm text-text-primary font-mono focus:outline-none"
                  />
                  <button
                    onClick={copyInvite}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-cyan/15 hover:bg-brand-cyan/25 text-brand-cyan rounded-lg text-sm font-medium transition-colors font-body"
                  >
                    <Copy size={14} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-text-muted text-xs font-body">This link expires in 7 days. Send it to a family member to let them join.</p>
                <button
                  onClick={generateInvite}
                  className="text-brand-purple hover:text-brand-magenta text-xs font-body transition-colors"
                >
                  Generate new link
                </button>
              </div>
            ) : (
              <button
                onClick={generateInvite}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple hover:bg-brand-magenta text-white rounded-lg text-sm font-medium transition-colors font-body"
              >
                <UserPlus size={16} />
                Generate Invite Link
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-6">
        <div>
          <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Dashboard Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-text-muted text-xs font-display uppercase tracking-wider mb-1">App</p>
              <p className="text-text-primary text-sm font-body">CMDCTRL Family Dashboard</p>
            </div>
            <div>
              <p className="text-text-muted text-xs font-display uppercase tracking-wider mb-1">Running On</p>
              <p className="text-text-primary text-sm font-mono">localhost:3025</p>
            </div>
            <div>
              <p className="text-text-muted text-xs font-display uppercase tracking-wider mb-1">Database</p>
              <p className="text-text-primary text-sm font-mono">SQLite (./data/dashboard.db)</p>
            </div>
            <div>
              <p className="text-text-muted text-xs font-display uppercase tracking-wider mb-1">Brand</p>
              <p className="text-text-primary text-sm font-body">Triptych Interactive</p>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-border pt-6">
          <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Connected Services</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-text-primary text-sm font-body">ClickUp</p>
                <p className="text-text-muted text-xs font-mono">
                  {settings.clickup_token ? `Token: ${settings.clickup_token}` : 'Not configured'}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                settings.clickup_token ? 'bg-brand-green/15 text-brand-green' : 'bg-surface-primary text-text-muted'
              }`}>
                {settings.clickup_token ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-text-primary text-sm font-body">Google Calendar</p>
                <p className="text-text-muted text-xs font-body">Via Claude Code MCP</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-brand-amber/15 text-brand-amber">
                Via MCP
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-border pt-6">
          <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Data Management</h3>
          <p className="text-text-muted text-sm font-body mb-3">
            All data is stored locally in SQLite. Your data never leaves your network.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple hover:bg-brand-magenta text-white rounded-lg text-sm font-medium transition-colors font-body"
            >
              {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
