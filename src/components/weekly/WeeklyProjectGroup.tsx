'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import WeeklyTaskItem from './WeeklyTaskItem';
import type { WeeklyTaskNested } from '@/types/weekly';

interface Props {
  project: string;
  tasks: WeeklyTaskNested[];
  onToggle: (id: number, completed: number) => void;
  onDelete: (id: number) => void;
}

export default function WeeklyProjectGroup({ project, tasks, onToggle, onDelete }: Props) {
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="mb-3">
      <h4 className="text-xs font-display font-semibold text-brand-purple uppercase tracking-wider px-2 mb-1">
        {project}
      </h4>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <WeeklyTaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </SortableContext>
    </div>
  );
}
