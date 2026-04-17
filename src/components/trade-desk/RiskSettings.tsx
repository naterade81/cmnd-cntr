'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Save, Pencil } from 'lucide-react';
import type { RiskSettings as RiskSettingsType } from '@/types/trade-desk';

interface Props {
  settings: RiskSettingsType | null;
  onSave: (settings: RiskSettingsType) => Promise<void>;
}

const LABELS: Record<string, string> = {
  max_position_size: 'Max Position Size ($)',
  max_portfolio_risk: 'Max Portfolio Risk (%)',
  stop_loss_percent: 'Stop Loss (%)',
  take_profit_percent: 'Take Profit (%)',
  max_positions: 'Max Positions',
  min_confidence: 'Min Confidence',
};

export default function RiskSettings({ settings, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const entries = settings ? Object.entries(settings).filter(([, v]) => v !== undefined && v !== null) : [];

  const startEdit = () => {
    const d: Record<string, string> = {};
    entries.forEach(([k, v]) => { d[k] = String(v); });
    setDraft(d);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsed: RiskSettingsType = {};
      Object.entries(draft).forEach(([k, v]) => {
        const num = Number(v);
        parsed[k] = isNaN(num) ? v : num;
      });
      await onSave(parsed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">
          Risk Settings
        </h3>
        {open ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-surface-border/50 pt-4">
          {!settings ? (
            <p className="text-text-muted text-sm font-body">No settings available</p>
          ) : editing ? (
            <div className="space-y-3">
              {Object.entries(draft).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-text-muted text-xs font-display w-40 shrink-0">
                    {LABELS[key] || key}
                  </label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className="flex-1 bg-surface-primary border border-surface-border rounded-lg px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-brand-purple"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-display font-semibold bg-brand-purple text-white hover:bg-brand-purple/80 disabled:opacity-50"
                >
                  <Save size={12} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-display text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-2">
                {entries.map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-text-muted text-xs font-display">
                      {LABELS[key] || key}
                    </span>
                    <span className="text-text-primary text-sm font-mono">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg text-xs font-display text-text-muted hover:text-text-primary hover:bg-surface-border/50 transition-colors"
              >
                <Pencil size={12} />
                Edit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
