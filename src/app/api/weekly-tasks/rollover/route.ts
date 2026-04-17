import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { rolloverWeeklyTasks, getIncompleteTasksForWeek } from '@/lib/weekly-tasks';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const weekStart = req.nextUrl.searchParams.get('week_start');
    if (!weekStart) return NextResponse.json({ error: 'week_start is required' }, { status: 400 });
    const incomplete = getIncompleteTasksForWeek(userId, weekStart);
    return NextResponse.json(incomplete);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    if (!body.new_week_start || !Array.isArray(body.tasks)) {
      return NextResponse.json({ error: 'new_week_start and tasks array required' }, { status: 400 });
    }
    const created = rolloverWeeklyTasks(userId, body.new_week_start, body.tasks);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
