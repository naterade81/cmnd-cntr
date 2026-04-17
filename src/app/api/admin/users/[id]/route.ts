import { NextRequest, NextResponse } from 'next/server';
import { deleteUser, getUserById } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireAdmin(req);
    const { id } = await params;
    const targetId = parseInt(id);

    if (targetId === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const target = getUserById(targetId);
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    deleteUser(targetId);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
}
