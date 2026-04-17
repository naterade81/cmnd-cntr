import { NextRequest, NextResponse } from 'next/server';
import { getGoal, updateGoal, deleteGoal } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await params;
    const goal = getGoal(parseInt(id));
    if (!goal || (goal as { user_id?: number }).user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const updated = updateGoal(parseInt(id), body);
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
    const goal = getGoal(parseInt(id));
    if (!goal || (goal as { user_id?: number }).user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    deleteGoal(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
