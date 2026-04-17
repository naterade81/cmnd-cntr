import { NextRequest, NextResponse } from 'next/server';
import { getEffortLogs, createEffortLog } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const logs = getEffortLogs(userId, days);
    return NextResponse.json(logs);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    if (!body.hours || body.hours <= 0) {
      return NextResponse.json({ error: 'Hours must be positive' }, { status: 400 });
    }
    const log = createEffortLog(userId, body);
    return NextResponse.json(log, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
