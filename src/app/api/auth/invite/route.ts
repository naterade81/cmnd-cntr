import { NextResponse } from 'next/server';
import { requireAdmin, generateInviteToken, AuthError } from '@/lib/auth';
import { getActiveInviteTokens } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { userId } = requireAdmin(req);
    const token = generateInviteToken(userId);
    const host = req.headers.get('host') || 'localhost:3025';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const url = `${protocol}://${host}/register?token=${token}`;
    return NextResponse.json({ token, url });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = requireAdmin(req);
    const tokens = getActiveInviteTokens(userId);
    return NextResponse.json({ tokens });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
}
