import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { getFamilyMemberStats, getFamilyWeeklyEffort, getFamilyRecentActivity } from '@/lib/family';

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
    const memberStats = getFamilyMemberStats();
    const weeklyEffort = getFamilyWeeklyEffort();
    const recentActivity = getFamilyRecentActivity(15);
    return NextResponse.json({ memberStats, weeklyEffort, recentActivity });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
