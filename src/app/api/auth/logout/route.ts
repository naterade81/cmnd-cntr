import { NextResponse } from 'next/server';
import { getAuthFromRequest, destroySession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  const auth = getAuthFromRequest(req);
  if (auth) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) destroySession(match[1]);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
