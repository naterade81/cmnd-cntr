import { NextRequest, NextResponse } from 'next/server';
import { getCalendarEvents, syncCalendarEvents, getCalendarSyncedAt } from '@/lib/db';
import type { CalendarEventRow } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const events = getCalendarEvents(userId, from, to);
    const syncedAt = getCalendarSyncedAt(userId);
    return NextResponse.json({ events, syncedAt });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    const events: CalendarEventRow[] = body.events || [];
    syncCalendarEvents(userId, events);
    return NextResponse.json({ synced: events.length });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
