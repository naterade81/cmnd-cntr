import { redirect } from 'next/navigation';
import { getAuthFromCookies } from '@/lib/auth';
import { getWeeklyTasksByDay, getCurrentWeekStart } from '@/lib/weekly-tasks';
import WeeklyPlannerClient from './WeeklyPlannerClient';

export const dynamic = 'force-dynamic';

export default async function WeeklyPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/login');
  const { userId } = auth;

  const weekStart = getCurrentWeekStart();
  const weeklyTasks = getWeeklyTasksByDay(userId, weekStart);

  return <WeeklyPlannerClient initialWeekStart={weekStart} initialTasks={weeklyTasks} />;
}
