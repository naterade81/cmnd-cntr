'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, Flame, FolderOpen, ListTodo } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ProductivityChart from '@/components/charts/ProductivityChart';
import TrendsChart from '@/components/charts/TrendsChart';
import ProjectProgressChart from '@/components/charts/ProjectProgressChart';
import WeeklyTodoWidget from '@/components/weekly/WeeklyTodoWidget';
import MiniCalendar from '@/components/MiniCalendar';
import RolloverModal from '@/components/weekly/RolloverModal';
import type { DashboardStats, WeeklyEffort, TrendData, ProjectProgress, WeeklyTasksByDay } from '@/types';

interface Props {
  stats: DashboardStats;
  weeklyEffort: WeeklyEffort[];
  trends: TrendData[];
  projectProgress: ProjectProgress[];
  weekStart: string;
  weeklyTasks: WeeklyTasksByDay;
  needsRollover: boolean;
  previousWeekStart: string;
}

export default function DashboardClient({
  stats, weeklyEffort, trends, projectProgress,
  weekStart, weeklyTasks, needsRollover, previousWeekStart,
}: Props) {
  const [showRollover, setShowRollover] = useState(needsRollover);

  return (
    <div className="space-y-6">
      {showRollover && (
        <RolloverModal
          previousWeekStart={previousWeekStart}
          newWeekStart={weekStart}
          onComplete={() => { setShowRollover(false); window.location.reload(); }}
        />
      )}

      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Good {getGreeting()}, Nathan
        </h2>
        <p className="text-text-muted text-sm font-body mt-1">
          Here&apos;s your productivity overview
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard label="Due Today" value={stats.tasksToday} icon={ListTodo} color="#AF00F1" />
        <StatCard label="Completed (7d)" value={stats.tasksCompleted} icon={CheckCircle2} color="#4ade80" />
        <StatCard label="Hours (7d)" value={stats.hoursThisWeek.toFixed(1)} icon={Clock} color="#00e5ff" />
        <StatCard label="Active Projects" value={stats.activeProjects} icon={FolderOpen} color="#fbbf24" />
        <StatCard label="Streak" value={`${stats.streak}d`} icon={Flame} color="#f72585" subtitle="consecutive days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ProductivityChart data={weeklyEffort} />
        <TrendsChart data={trends} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <WeeklyTodoWidget weekStart={weekStart} initialTasks={weeklyTasks} />
        <ProjectProgressChart projects={projectProgress} />
        <MiniCalendar />
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
