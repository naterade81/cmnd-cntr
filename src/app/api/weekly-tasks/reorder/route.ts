import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { reorderWeeklyTasks } from '@/lib/weekly-tasks';

export async function PATCH(req: NextRequest) {
  try {
    requireAuth(req);
    const body = await req.json();
    if (!Array.isArray(body.tasks)) {
      return NextResponse.json({ error: 'tasks array is required' }, { status: 400 });
    }
    reorderWeeklyTasks(body.tasks);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
