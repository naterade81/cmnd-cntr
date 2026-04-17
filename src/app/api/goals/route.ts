import { NextRequest, NextResponse } from 'next/server';
import { getAllGoals, createGoal } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    return NextResponse.json(getAllGoals(userId));
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    if (!body.title || !body.target_value) {
      return NextResponse.json({ error: 'Title and target_value are required' }, { status: 400 });
    }
    const goal = createGoal(userId, body);
    return NextResponse.json(goal, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
