'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { DayOfWeek, WeeklyTaskNested } from '@/types/weekly';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
];

interface Props {
  previousWeekStart: string;
  newWeekStart: string;
  onComplete: () => void;
}

interface Selection {
  id: number;
  day_of_week: DayOfWeek;
  selected: boolean;
}

export default function RolloverModal({ previousWeekStart, newWeekStart, onComplete }: Props) {
  const [incompleteTasks, setIncompleteTasks] = useState<WeeklyTaskNested[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/weekly-tasks/rollover?week_start=${previousWeekStart}`);
      if (res.ok) {
        const tasks: WeeklyTaskNested[] = await res.json();
        setIncompleteTasks(tasks);
        setSelections(tasks.map((t) => ({ id: t.id, day_of_week: t.day_of_week, selected: true })));
      }
      setLoading(false);
    }
    load();
  }, [previousWeekStart]);

  function toggleSelect(id: number) {
    setSelections((prev) => prev.map((s) => s.id === id ? { ...s, selected: !s.selected } : s));
  }

  function toggleAll(selected: boolean) {
    setSelections((prev) => prev.map((s) => ({ ...s, selected })));
  }

  function updateDay(id: number, day: DayOfWeek) {
    setSelections((prev) => prev.map((s) => s.id === id ? { ...s, day_of_week: day } : s));
  }

  async function handleCarryOver() {
    const selected = selections.filter((s) => s.selected);
    if (selected.length > 0) {
      await fetch('/api/weekly-tasks/rollover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_week_start: newWeekStart, tasks: selected }),
      });
    }
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekly_rollover_done: newWeekStart }),
    });
    onComplete();
  }

  async function handleStartFresh() {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekly_rollover_done: newWeekStart }),
    });
    onComplete();
  }

  if (loading) return null;
  if (incompleteTasks.length === 0) {
    handleStartFresh();
    return null;
  }

  const allSelected = selections.every((s) => s.selected);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-primary border border-surface-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">New Week — Carry Over Tasks?</h2>
            <p className="text-xs text-text-muted font-body mt-0.5">
              {incompleteTasks.length} incomplete task{incompleteTasks.length !== 1 ? 's' : ''} from last week
            </p>
          </div>
          <button onClick={handleStartFresh} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-2 border-b border-surface-border">
          <button
            onClick={() => toggleAll(!allSelected)}
            className="text-xs text-brand-purple hover:text-brand-magenta font-body transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {incompleteTasks.map((task) => {
            const sel = selections.find((s) => s.id === task.id);
            if (!sel) return null;
            return (
              <div key={task.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-card">
                <input
                  type="checkbox"
                  checked={sel.selected}
                  onChange={() => toggleSelect(task.id)}
                  className="accent-brand-purple"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-body truncate">{task.title}</p>
                  <p className="text-xs text-text-muted font-mono">{task.project}</p>
                  {task.children.length > 0 && (
                    <p className="text-xs text-text-muted font-body mt-0.5">
                      + {task.children.length} sub-task{task.children.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <ArrowRight size={14} className="text-text-muted flex-shrink-0" />
                <select
                  value={sel.day_of_week}
                  onChange={(e) => updateDay(task.id, e.target.value as DayOfWeek)}
                  disabled={!sel.selected}
                  className="bg-surface-card border border-surface-border rounded px-2 py-1 text-xs text-text-primary font-body focus:border-brand-purple focus:outline-none disabled:opacity-40"
                >
                  {DAYS.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <button
            onClick={handleStartFresh}
            className="text-sm text-text-muted hover:text-text-primary font-body transition-colors"
          >
            Start Fresh
          </button>
          <button
            onClick={handleCarryOver}
            className="bg-brand-purple text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-magenta transition-colors font-body"
          >
            Carry Over Selected
          </button>
        </div>
      </div>
    </div>
  );
}
