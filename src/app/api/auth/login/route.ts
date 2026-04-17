import { NextRequest, NextResponse } from 'next/server';
import { login, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { name, pin } = await req.json();
  if (!name || !pin) {
    return NextResponse.json({ error: 'Name and PIN are required' }, { status: 400 });
  }

  const result = login(name, pin);
  if (!result) {
    return NextResponse.json({ error: 'Invalid name or PIN' }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: result.user.id,
      name: result.user.name,
      display_name: result.user.display_name,
      role: result.user.role,
      avatar_color: result.user.avatar_color,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
