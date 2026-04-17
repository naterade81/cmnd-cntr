import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setSettings } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const settings = getAllSettings(userId);
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (key.includes('token') || key.includes('key')) {
        masked[key] = value.length > 12 ? value.slice(0, 8) + '...' + value.slice(-4) : '***';
      } else {
        masked[key] = value;
      }
    }
    return NextResponse.json(masked);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    setSettings(userId, body);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
