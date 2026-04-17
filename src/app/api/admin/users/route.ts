import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const users = getAllUsers().map((u) => ({
      id: u.id,
      name: u.name,
      display_name: u.display_name,
      role: u.role,
      avatar_color: u.avatar_color,
      created_at: u.created_at,
    }));
    return NextResponse.json(users);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
}
