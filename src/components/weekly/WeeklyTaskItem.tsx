'use client';

import { useState } from 'react';
import { Check, GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WeeklyTaskNested } from '@/types/weekly';

interface Props {
  task: WeeklyTaskNested;
  isChild?: boolean;
  onToggle: (id: number, completed: number) => void;
  onDelete: (id: number) => void;
}

export default function WeeklyTaskItem({ task, isChild = false, onToggle, onDelete }: Props) {
  const [showDelete, setShowDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = task.children.length > 0;
  const isCompleted = task.completed === 1;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md group hover:bg-surface-card-hover transition-colors ${
          isChild ? 'ml-6' : ''
        }`}
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
      >
        <button {...attributes} {...listeners} className="text-text-muted opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
          <GripVertical size={14} />
        </button>

        <button
          onClick={() => onToggle(task.id, isCompleted ? 0 : 1)}
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-brand-purple border-brand-purple'
              : 'border-surface-border-bright hover:border-brand-purple'
          }`}
        >
          {isCompleted && <Check size={10} className="text-white" />}
        </button>

        <span
          className={`text-sm font-body flex-1 min-w-0 truncate ${
            isCompleted ? 'text-text-muted line-through' : 'text-text-primary'
          }`}
        >
          {task.title}
        </span>

        {hasChildren && (
          <span className="text-xs font-mono text-text-muted flex-shrink-0">
            {task.childrenCompleted}/{task.childrenTotal}
          </span>
        )}

        {showDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="text-text-muted hover:text-brand-red transition-colors flex-shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {hasChildren && task.children.map((child) => (
        <WeeklyTaskItem key={child.id} task={child} isChild onToggle={onToggle} onDelete={onDelete} />
      ))}
    </div>
  );
}
