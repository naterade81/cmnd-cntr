import { NextRequest, NextResponse } from 'next/server';
import { getTask, updateTask, deleteTask } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await params;
    const task = getTask(parseInt(id));
    if (!task || (task as { user_id?: number }).user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(task);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await params;
    const task = getTask(parseInt(id));
    if (!task || (task as { user_id?: number }).user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const updated = updateTask(parseInt(id), body);
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
    const task = getTask(parseInt(id));
    if (!task || (task as { user_id?: number }).user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    deleteTask(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
