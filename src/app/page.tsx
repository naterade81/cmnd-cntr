import { redirect } from 'next/navigation';
import {
  getTasksDueToday,
  getTasksCompletedSince,
  getHoursSince,
  getActiveProjectCount,
  getStreak,
  getWeeklyEffort,
  getTrends,
  getProjectProgress,
  getSetting,
} from '@/lib/db';
import { getWeeklyTasksByDay, getCurrentWeekStart, getPreviousWeekStart } from '@/lib/weekly-tasks';
import { getAuthFromCookies } from '@/lib/auth';
import DashboardClient from './DashboardClient';
import type { DashboardStats } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/login');
  const { userId } = auth;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const stats: DashboardStats = {
    tasksToday: getTasksDueToday(userId),
    tasksCompleted: getTasksCompletedSince(userId, weekAgo),
    hoursThisWeek: getHoursSince(userId, weekAgo),
    activeProjects: getActiveProjectCount(userId),
    streak: getStreak(userId),
  };

  const weeklyEffort = getWeeklyEffort(userId);
  const trends = getTrends(userId);
  const projectProgress = getProjectProgress(userId);

  const weekStart = getCurrentWeekStart();
  const weeklyTasks = getWeeklyTasksByDay(userId, weekStart);

  const rolloverDone = getSetting(userId, 'weekly_rollover_done');
  const previousWeekStart = getPreviousWeekStart(weekStart);
  const needsRollover = rolloverDone !== weekStart;

  return (
    <DashboardClient
      stats={stats}
      weeklyEffort={weeklyEffort}
      trends={trends}
      projectProgress={projectProgress}
      weekStart={weekStart}
      weeklyTasks={weeklyTasks}
      needsRollover={needsRollover}
      previousWeekStart={previousWeekStart}
    />
  );
}
