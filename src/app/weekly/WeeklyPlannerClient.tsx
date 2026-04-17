'use client';

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import WeeklyProjectGroup from '@/components/weekly/WeeklyProjectGroup';
import AddWeeklyTaskForm from '@/components/weekly/AddWeeklyTaskForm';
import type { DayOfWeek, WeeklyTaskNested, WeeklyTasksByDay } from '@/types/weekly';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
];

interface Props {
  initialWeekStart: string;
  initialTasks: WeeklyTasksByDay;
}

function groupByProject(tasks: WeeklyTaskNested[]): Record<string, WeeklyTaskNested[]> {
  const groups: Record<string, WeeklyTaskNested[]> = {};
  for (const task of tasks) {
    if (!groups[task.project]) groups[task.project] = [];
    groups[task.project].push(task);
  }
  return groups;
}

function getTodayDayKey(): DayOfWeek | '' {
  const d = new Date().getDay();
  const map: Record<number, DayOfWeek> = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' };
  return map[d] || '';
}

export default function WeeklyPlannerClient({ initialWeekStart, initialTasks }: Props) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [tasks, setTasks] = useState<WeeklyTasksByDay>(initialTasks);

  const weekEnd = format(addDays(parseISO(weekStart), 4), 'MMM d');
  const weekStartFormatted = format(parseISO(weekStart), 'MMM d, yyyy');

  const allProjects = [...new Set(Object.values(tasks).flat().map((t) => t.project))];

  const refreshTasks = useCallback(async (ws?: string) => {
    const targetWeek = ws || weekStart;
    const res = await fetch(`/api/weekly-tasks?week_start=${targetWeek}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
  }, [weekStart]);

  async function navigateWeek(direction: -1 | 1) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + direction * 7);
    const newWeek = d.toISOString().split('T')[0];
    setWeekStart(newWeek);
    refreshTasks(newWeek);
  }

  function goToToday() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const ws = monday.toISOString().split('T')[0];
    setWeekStart(ws);
    refreshTasks(ws);
  }

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

    const allFlat = Object.values(tasks).flat().flatMap((t) => [t, ...t.children]);
    const activeTask = allFlat.find((t) => t.id === active.id);
    const overTask = allFlat.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;

    const reorderPayload = [
      { id: activeTask.id, sort_order: overTask.sort_order },
      { id: overTask.id, sort_order: activeTask.sort_order },
    ];

    if (activeTask.day_of_week !== overTask.day_of_week) {
      await fetch(`/api/weekly-tasks/${activeTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: overTask.day_of_week }),
      });
    }

    await fetch('/api/weekly-tasks/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: reorderPayload }),
    });
    refreshTasks();
  }

  const todayKey = getTodayDayKey();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary">Weekly Plan</h2>
          <p className="text-text-muted text-sm font-body mt-1">
            {weekStartFormatted} – {weekEnd}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-2 rounded-lg border border-surface-border text-xs text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors font-body"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4">
          {DAYS.map(({ key, label }) => {
            const dayTasks = tasks[key] || [];
            const projectGroups = groupByProject(dayTasks);
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className={`bg-surface-card border rounded-xl p-4 min-h-[400px] flex flex-col ${
                  isToday ? 'border-brand-purple/40' : 'border-surface-border'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-display text-sm font-semibold uppercase tracking-wider ${
                    isToday ? 'text-brand-purple' : 'text-text-primary'
                  }`}>
                    {label}
                  </h3>
                  {isToday && (
                    <span className="w-2 h-2 rounded-full bg-brand-purple" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  {Object.keys(projectGroups).length === 0 ? (
                    <p className="text-text-muted text-xs font-body py-4 text-center">No tasks</p>
                  ) : (
                    Object.entries(projectGroups).map(([project, projectTasks]) => (
                      <WeeklyProjectGroup key={project} project={project} tasks={projectTasks} onToggle={handleToggle} onDelete={handleDelete} />
                    ))
                  )}
                </div>

                <AddWeeklyTaskForm
                  weekStart={weekStart}
                  day={key}
                  existingProjects={allProjects}
                  existingTasks={dayTasks.filter((t) => t.parent_id === null)}
                  onAdd={handleAdd}
                />
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
