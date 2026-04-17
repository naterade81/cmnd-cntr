'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface BillingEntry {
  date: string;
  project: string;
  who: string;
  description: string;
  projectCategory: string;
  company: string;
  decimalHours: number;
  billable: boolean;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BillingPage() {
  const now = new Date();
  // Default to previous month
  const defaultMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [entries, setEntries] = useState<BillingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [billableFilter, setBillableFilter] = useState<'all' | 'billable' | 'non-billable'>('all');

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setFetched(false);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setFetched(false);
  }

  async function fetchEntries() {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing?year=${year}&month=${month}&format=json`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setFetched(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    window.open(`/api/billing?year=${year}&month=${month}&format=csv`, '_blank');
  }

  // Filter entries
  const filtered = billableFilter === 'all' ? entries
    : billableFilter === 'billable' ? entries.filter((e) => e.billable)
    : entries.filter((e) => !e.billable);

  // Group entries by project for preview
  const groups = new Map<string, BillingEntry[]>();
  for (const entry of filtered) {
    if (!groups.has(entry.project)) groups.set(entry.project, []);
    groups.get(entry.project)!.push(entry);
  }

  const totalHours = Math.round(filtered.reduce((s, e) => s + e.decimalHours, 0) * 100) / 100;
  const billableHours = Math.round(entries.filter((e) => e.billable).reduce((s, e) => s + e.decimalHours, 0) * 100) / 100;
  const nonBillableHours = Math.round(entries.filter((e) => !e.billable).reduce((s, e) => s + e.decimalHours, 0) * 100) / 100;
  const uniquePeople = new Set(filtered.map((e) => e.who)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-display text-xl md:text-2xl font-bold text-text-primary">Billing Export</h2>
        <div className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-lg px-2 py-1">
          <button onClick={prevMonth} className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="font-display font-semibold text-text-primary min-w-[140px] text-center text-sm">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={fetchEntries}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-purple hover:bg-brand-magenta disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors font-body"
        >
          <FileSpreadsheet size={16} />
          {loading ? 'Pulling from ClickUp...' : 'Pull Time Entries'}
        </button>
        {fetched && entries.length > 0 && (
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-green/15 hover:bg-brand-green/25 text-brand-green rounded-lg text-sm font-medium transition-colors font-body"
          >
            <Download size={16} />
            Download CSV
          </button>
        )}
      </div>

      {/* Billable Filter */}
      {fetched && entries.length > 0 && (
        <div className="flex gap-2">
          {(['all', 'billable', 'non-billable'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setBillableFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${
                billableFilter === f
                  ? 'bg-brand-purple text-white'
                  : 'bg-surface-card border border-surface-border text-text-muted hover:text-text-primary'
              }`}
            >
              {f === 'all' ? 'All' : f === 'billable' ? 'Billable' : 'Non-Billable'}
            </button>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {fetched && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <p className="text-text-muted text-xs uppercase tracking-wider font-display">Total Hours</p>
            <p className="text-2xl font-display font-bold text-text-primary mt-2">{totalHours}h</p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <p className="text-text-muted text-xs uppercase tracking-wider font-display">Billable</p>
            <p className="text-2xl font-display font-bold text-brand-green mt-2">{billableHours}h</p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <p className="text-text-muted text-xs uppercase tracking-wider font-display">Non-Billable</p>
            <p className="text-2xl font-display font-bold text-brand-amber mt-2">{nonBillableHours}h</p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider font-display">
              <Users size={12} />
              <p>Team / Projects</p>
            </div>
            <p className="text-2xl font-display font-bold text-brand-cyan mt-2">{uniquePeople} / {groups.size}</p>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {fetched && entries.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-surface-border">
            <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">Preview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-4 py-2 text-text-muted font-display text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-2 text-text-muted font-display text-xs uppercase tracking-wider">Project</th>
                  <th className="text-left px-4 py-2 text-text-muted font-display text-xs uppercase tracking-wider">Who</th>
                  <th className="text-left px-4 py-2 text-text-muted font-display text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right px-4 py-2 text-text-muted font-display text-xs uppercase tracking-wider">Hours</th>
                  <th className="text-center px-4 py-2 text-text-muted font-display text-xs uppercase tracking-wider">Billable</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(groups.entries()).map(([project, groupEntries]) => {
                  const groupTotal = Math.round(groupEntries.reduce((s, e) => s + e.decimalHours, 0) * 1000) / 1000;
                  const sorted = [...groupEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  return (
                    <tbody key={project}>
                      {/* Subtotal row */}
                      <tr className="bg-surface-primary/50 border-b border-surface-border">
                        <td colSpan={4} className="px-4 py-2 font-display font-semibold text-text-primary text-xs uppercase">{project}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-brand-amber">{groupTotal}</td>
                        <td></td>
                      </tr>
                      {/* Entry rows */}
                      {sorted.map((entry, i) => (
                        <tr key={i} className="border-b border-surface-border/50 hover:bg-surface-card-hover transition-colors">
                          <td className="px-4 py-2 font-mono text-text-muted text-xs">{entry.date}</td>
                          <td className="px-4 py-2 font-body text-text-primary text-xs">{entry.project}</td>
                          <td className="px-4 py-2 font-body text-text-primary text-xs">{entry.who}</td>
                          <td className="px-4 py-2 font-body text-text-muted text-xs max-w-xs truncate">{entry.description}</td>
                          <td className="px-4 py-2 text-right font-mono text-text-primary text-xs">{entry.decimalHours}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              entry.billable ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-amber/15 text-brand-amber'
                            }`}>
                              {entry.billable ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {fetched && entries.length === 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-10 text-center">
          <Clock size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted font-body">No time entries found for {MONTH_NAMES[month]} {year}.</p>
        </div>
      )}
    </div>
  );
}
