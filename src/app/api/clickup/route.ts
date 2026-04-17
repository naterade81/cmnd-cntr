import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting, upsertTaskByClickupId } from '@/lib/db';
import { getClickUpTeams, getMyClickUpTasks, findClickUpMember } from '@/lib/clickup';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const token = getSetting(userId, 'clickup_token') || process.env.CLICKUP_TOKEN;
    if (!token) {
      return NextResponse.json({ configured: false, message: 'ClickUp token not configured' });
    }

    const teamsData = await getClickUpTeams();
    const teams = teamsData.teams || [];
    if (teams.length === 0) {
      return NextResponse.json({ configured: true, teams: [], tasks: [] });
    }
    const tasksData = await getMyClickUpTasks(teams[0].id);
    return NextResponse.json({ configured: true, teams, tasks: tasksData.tasks || [] });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ configured: true, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();

    if (body.action === 'set_token') {
      setSetting(userId, 'clickup_token', body.token);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'sync') {
      const token = getSetting(userId, 'clickup_token') || process.env.CLICKUP_TOKEN;
      if (!token) return NextResponse.json({ error: 'Token not configured' }, { status: 400 });

      const teamsData = await getClickUpTeams();
      const teamId = teamsData.teams?.[0]?.id;
      if (!teamId) return NextResponse.json({ synced: 0 });

      // Filter tasks to only those assigned to Nate Johnson
      const assigneeId = await findClickUpMember(teamId, 'nate');
      const tasksData = await getMyClickUpTasks(teamId, assigneeId || undefined);
      const clickupTasks = tasksData.tasks || [];
      let synced = 0;

      for (const t of clickupTasks) {
        const status = t.status?.status === 'complete' ? 'completed' :
                       t.status?.status === 'in progress' ? 'in_progress' : 'pending';
        const priority = t.priority?.priority === 'urgent' ? 'urgent' :
                         t.priority?.priority === 'high' ? 'high' :
                         t.priority?.priority === 'low' ? 'low' : 'medium';
        const dueDate = t.due_date ? new Date(parseInt(t.due_date)).toISOString().split('T')[0] : null;

        upsertTaskByClickupId(userId, t.id, {
          title: t.name,
          description: t.description || null,
          status,
          priority,
          project: t.list?.name || t.folder?.name || null,
          due_date: dueDate,
          clickup_url: t.url || `https://app.clickup.com/t/${t.id}`,
        });
        synced++;
      }

      return NextResponse.json({ synced });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
