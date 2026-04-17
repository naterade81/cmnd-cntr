import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  const auth = getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: auth.user.id,
      name: auth.user.name,
      display_name: auth.user.display_name,
      role: auth.user.role,
      avatar_color: auth.user.avatar_color,
    },
  });
}
