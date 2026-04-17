import { NextRequest, NextResponse } from 'next/server';
import { registerWithInvite, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getUserByName } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { token, name, display_name, pin, avatar_color } = await req.json();

  if (!token || !name || !display_name || !pin) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  if (pin.length < 4) {
    return NextResponse.json({ error: 'PIN must be at least 4 characters' }, { status: 400 });
  }

  if (getUserByName(name.toLowerCase())) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  const result = registerWithInvite(token, name, display_name, pin, avatar_color);
  if (!result) {
    return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 400 });
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
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
