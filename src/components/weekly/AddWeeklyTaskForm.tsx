'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import type { DayOfWeek, WeeklyTaskNested } from '@/types/weekly';

interface Props {
  weekStart: string;
  day: DayOfWeek;
  existingProjects: string[];
  existingTasks: WeeklyTaskNested[];
  onAdd: (data: { week_start: string; day_of_week: DayOfWeek; project: string; title: string; parent_id?: number }) => void;
}

export default function AddWeeklyTaskForm({ weekStart, day, existingProjects, existingTasks, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [parentId, setParentId] = useState<number | undefined>(undefined);
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filteredProjects = existingProjects.filter(
    (p) => p.toLowerCase().includes(project.toLowerCase()) && p !== project
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !project.trim()) return;
    onAdd({ week_start: weekStart, day_of_week: day, project: project.trim(), title: title.trim(), parent_id: parentId });
    setTitle('');
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-purple transition-colors mt-2 px-2"
      >
        <Plus size={12} />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 px-2 space-y-2">
      <div className="relative">
        <input
          type="text"
          value={project}
          onChange={(e) => { setProject(e.target.value); setShowProjectSuggestions(true); }}
          onFocus={() => setShowProjectSuggestions(true)}
          onBlur={() => setTimeout(() => setShowProjectSuggestions(false), 150)}
          placeholder="Project"
          className="w-full bg-surface-card border border-surface-border rounded px-2 py-1 text-xs text-text-primary font-body placeholder:text-text-muted focus:border-brand-purple focus:outline-none"
        />
        {showProjectSuggestions && filteredProjects.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 bg-surface-card border border-surface-border rounded mt-0.5 max-h-24 overflow-y-auto">
            {filteredProjects.map((p) => (
              <button
                key={p}
                type="button"
                className="block w-full text-left px-2 py-1 text-xs text-text-primary hover:bg-surface-card-hover"
                onMouseDown={() => { setProject(p); setShowProjectSuggestions(false); }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full bg-surface-card border border-surface-border rounded px-2 py-1 text-xs text-text-primary font-body placeholder:text-text-muted focus:border-brand-purple focus:outline-none"
      />

      {existingTasks.length > 0 && (
        <select
          value={parentId ?? ''}
          onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full bg-surface-card border border-surface-border rounded px-2 py-1 text-xs text-text-primary font-body focus:border-brand-purple focus:outline-none"
        >
          <option value="">No parent (top-level)</option>
          {existingTasks.map((t) => (
            <option key={t.id} value={t.id}>{t.project}: {t.title}</option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-2">
        <button type="submit" className="bg-brand-purple text-white text-xs px-3 py-1 rounded hover:bg-brand-magenta transition-colors font-body">
          Add
        </button>
        <button type="button" onClick={() => { setOpen(false); setTitle(''); setProject(''); setParentId(undefined); }} className="text-text-muted hover:text-text-primary text-xs transition-colors">
          <X size={14} />
        </button>
      </div>
    </form>
  );
}
