'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock } from 'lucide-react';
import type { EffortLog, TaskCategory } from '@/types';

export default function EffortsPage() {
  const [logs, setLogs] = useState<EffortLog[]>([]);
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState<TaskCategory>('professional');
  const [project, setProject] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const res = await fetch('/api/efforts?days=30');
    setLogs(await res.json());
  }

  async function logEffort(e: React.FormEvent) {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) return;
    await fetch('/api/efforts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hours: parseFloat(hours),
        category,
        project: project.trim() || null,
        description: description.trim() || null,
        date,
      }),
    });
    setHours('');
    setDescription('');
    setProject('');
    fetchLogs();
  }

  const totalByCategory = logs.reduce(
    (acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + l.hours;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-text-primary">Log Effort</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <p className="text-text-muted text-xs uppercase tracking-wider font-display">Total (30d)</p>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">
            {Object.values(totalByCategory).reduce((a, b) => a + b, 0).toFixed(1)}h
          </p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <p className="text-text-muted text-xs uppercase tracking-wider font-display">Professional</p>
          <p className="text-3xl font-display font-bold text-brand-purple mt-2">
            {(totalByCategory.professional || 0).toFixed(1)}h
          </p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <p className="text-text-muted text-xs uppercase tracking-wider font-display">Personal</p>
          <p className="text-3xl font-display font-bold text-brand-cyan mt-2">
            {(totalByCategory.personal || 0).toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Log Form */}
      <form onSubmit={logEffort} className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
        <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">New Entry</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-display uppercase tracking-wider">Hours</label>
            <input
              type="number"
              step="0.25"
              min="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="2.5"
              className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-display uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary font-body focus:outline-none"
            >
              <option value="professional">Professional</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-display uppercase tracking-wider">Project</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Optional"
              className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted font-body focus:outline-none focus:border-brand-purple/50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-display uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-display uppercase tracking-wider">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted font-body focus:outline-none focus:border-brand-purple/50"
          />
        </div>
        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-brand-purple hover:bg-brand-magenta text-white rounded-lg text-sm font-medium transition-colors font-body">
          <Plus size={16} /> Log Effort
        </button>
      </form>

      {/* Log History */}
      <div className="bg-surface-card border border-surface-border rounded-xl divide-y divide-surface-border">
        <div className="p-4">
          <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">Recent Logs</h3>
        </div>
        {logs.length === 0 ? (
          <p className="text-text-muted text-sm p-6 font-body text-center">No effort logged yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
              <Clock size={16} className={`flex-shrink-0 ${log.category === 'professional' ? 'text-brand-purple' : 'text-brand-cyan'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body text-text-primary truncate">{log.description || 'No description'}</p>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    log.category === 'professional' ? 'bg-brand-purple/15 text-brand-purple' : 'bg-brand-cyan/15 text-brand-cyan'
                  }`}>{log.category}</span>
                  {log.project && <span className="text-xs text-text-muted font-mono">{log.project}</span>}
                  <span className="text-xs text-text-muted font-mono md:hidden">{log.date}</span>
                </div>
              </div>
              <span className="font-mono text-sm text-text-primary flex-shrink-0">{log.hours}h</span>
              <span className="text-xs text-text-muted font-mono flex-shrink-0 hidden md:inline">{log.date}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
