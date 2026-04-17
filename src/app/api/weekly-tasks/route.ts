import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { getWeeklyTasksByDay, createWeeklyTask, getCurrentWeekStart } from '@/lib/weekly-tasks';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const weekStart = req.nextUrl.searchParams.get('week_start') || getCurrentWeekStart();
    const tasksByDay = getWeeklyTasksByDay(userId, weekStart);
    return NextResponse.json({ week_start: weekStart, tasks: tasksByDay });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    if (!body.title || !body.project || !body.day_of_week || !body.week_start) {
      return NextResponse.json({ error: 'title, project, day_of_week, and week_start are required' }, { status: 400 });
    }
    const task = createWeeklyTask(userId, body);
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
