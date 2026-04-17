import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { getWeeklyTask, updateWeeklyTask, deleteWeeklyTask } from '@/lib/weekly-tasks';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await params;
    const task = getWeeklyTask(parseInt(id));
    if (!task || task.user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const updated = updateWeeklyTask(parseInt(id), body);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await params;
    const task = getWeeklyTask(parseInt(id));
    if (!task || task.user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    deleteWeeklyTask(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
