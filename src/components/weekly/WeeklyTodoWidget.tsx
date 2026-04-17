'use client';

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { CalendarRange } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import WeeklyProjectGroup from './WeeklyProjectGroup';
import AddWeeklyTaskForm from './AddWeeklyTaskForm';
import type { DayOfWeek, WeeklyTaskNested, WeeklyTasksByDay } from '@/types/weekly';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
];

interface Props {
  weekStart: string;
  initialTasks: WeeklyTasksByDay;
}

function getTodayDayKey(): DayOfWeek {
  const dayIndex = new Date().getDay();
  const map: Record<number, DayOfWeek> = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' };
  return map[dayIndex] || 'monday';
}

function groupByProject(tasks: WeeklyTaskNested[]): Record<string, WeeklyTaskNested[]> {
  const groups: Record<string, WeeklyTaskNested[]> = {};
  for (const task of tasks) {
    if (!groups[task.project]) groups[task.project] = [];
    groups[task.project].push(task);
  }
  return groups;
}

export default function WeeklyTodoWidget({ weekStart, initialTasks }: Props) {
  const [tasks, setTasks] = useState<WeeklyTasksByDay>(initialTasks);
  const [activeDay, setActiveDay] = useState<DayOfWeek>(getTodayDayKey());

  const weekEnd = format(addDays(parseISO(weekStart), 4), 'MMM d');
  const weekStartFormatted = format(parseISO(weekStart), 'MMM d');

  const dayTasks = tasks[activeDay] || [];
  const projectGroups = groupByProject(dayTasks);
  const allProjects = [...new Set(Object.values(tasks).flat().map((t) => t.project))];

  const refreshTasks = useCallback(async () => {
    const res = await fetch(`/api/weekly-tasks?week_start=${weekStart}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
  }, [weekStart]);

  async function handleToggle(id: number, completed: number) {
    await fetch(`/api/weekly-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    refreshTasks();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/weekly-tasks/${id}`, { method: 'DELETE' });
    refreshTasks();
  }

  async function handleAdd(data: { week_start: string; day_of_week: DayOfWeek; project: string; title: string; parent_id?: number }) {
    await fetch('/api/weekly-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    refreshTasks();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const flatTasks = dayTasks.flatMap((t) => [t, ...t.children]);
    const activeTask = flatTasks.find((t) => t.id === active.id);
    const overTask = flatTasks.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;

    await fetch('/api/weekly-tasks/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: [
          { id: activeTask.id, sort_order: overTask.sort_order },
          { id: overTask.id, sort_order: activeTask.sort_order },
        ],
      }),
    });
    refreshTasks();
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarRange size={16} className="text-brand-purple" />
          <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">
            Weekly To-Do
          </h3>
          <span className="text-xs text-text-muted font-mono">
            {weekStartFormatted} – {weekEnd}
          </span>
        </div>
        <a href="/weekly" className="text-brand-purple text-xs hover:text-brand-magenta transition-colors font-body">
          Full View
        </a>
      </div>

      <div className="flex gap-1 mb-4">
        {DAYS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveDay(key)}
            className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors ${
              activeDay === key
                ? 'bg-brand-purple/15 text-brand-purple border border-brand-purple/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-card-hover'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {Object.keys(projectGroups).length === 0 ? (
            <p className="text-text-muted text-sm font-body py-4 text-center">No tasks for this day</p>
          ) : (
            Object.entries(projectGroups).map(([project, tasks]) => (
              <WeeklyProjectGroup key={project} project={project} tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
            ))
          )}
        </div>
      </DndContext>

      <AddWeeklyTaskForm
        weekStart={weekStart}
        day={activeDay}
        existingProjects={allProjects}
        existingTasks={dayTasks.filter((t) => t.parent_id === null)}
        onAdd={handleAdd}
      />
    </div>
  );
}
