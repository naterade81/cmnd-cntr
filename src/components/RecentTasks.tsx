'use client';

import { Circle, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import type { Task } from '@/types';

interface Props {
  tasks: Task[];
  onToggle?: (id: number, status: string) => void;
}

const priorityColors = {
  low: 'text-text-muted',
  medium: 'text-brand-amber',
  high: 'text-brand-red',
  urgent: 'text-brand-red',
};

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
};

export default function RecentTasks({ tasks, onToggle }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">
          Recent Tasks
        </h3>
        <a href="/tasks" className="text-brand-purple text-xs hover:text-brand-magenta transition-colors font-body">
          View All
        </a>
      </div>
      {tasks.length === 0 ? (
        <p className="text-text-muted text-sm font-body">No tasks yet. Click &quot;Quick Add&quot; to create one.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const StatusIcon = statusIcons[task.status];
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-card-hover transition-colors cursor-pointer group"
                onClick={() => onToggle?.(task.id, task.status === 'completed' ? 'pending' : 'completed')}
              >
                <StatusIcon
                  size={18}
                  className={
                    task.status === 'completed'
                      ? 'text-brand-green'
                      : task.status === 'in_progress'
                      ? 'text-brand-cyan'
                      : 'text-text-muted group-hover:text-brand-purple'
                  }
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-body truncate ${
                      task.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.project && (
                      <span className="text-xs text-text-muted font-mono">{task.project}</span>
                    )}
                    {task.scheduled_date && (
                      <span className="text-xs text-brand-amber font-mono">{task.scheduled_date}</span>
                    )}
                    {task.due_date && (
                      <span className="text-xs text-text-muted font-mono">{task.due_date}</span>
                    )}
                  </div>
                </div>
                {task.clickup_url && (
                  <a
                    href={task.clickup_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-text-muted hover:text-brand-purple transition-colors"
                    title="Open in ClickUp"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
                <span
                  className={`w-2 h-2 rounded-full ${
                    task.category === 'professional' ? 'bg-brand-purple' : 'bg-brand-cyan'
                  }`}
                />
                <AlertCircle size={14} className={priorityColors[task.priority]} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
