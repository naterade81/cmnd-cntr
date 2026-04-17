import { getDb } from './sqlite';
import type { UserRow } from './db';

export interface FamilyMemberStats {
  user: {
    id: number;
    name: string;
    display_name: string;
    avatar_color: string;
  };
  tasksCompletedThisWeek: number;
  hoursThisWeek: number;
  streak: number;
  activeGoals: number;
}

export interface FamilyWeeklyEffort {
  day: string;
  [userId: string]: number | string; // userId keys map to hours, plus 'day' string
}

export interface FamilyActivity {
  type: 'task_completed' | 'effort_logged' | 'goal_progress';
  userName: string;
  userColor: string;
  description: string;
  timestamp: string;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

export function getFamilyMembers(): UserRow[] {
  return getDb().prepare('SELECT * FROM users ORDER BY created_at').all() as UserRow[];
}

export function getFamilyMemberStats(): FamilyMemberStats[] {
  const db = getDb();
  const users = db.prepare('SELECT * FROM users ORDER BY created_at').all() as UserRow[];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  return users.map((u) => {
    const tc = db.prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed' AND completed_at >= ?"
    ).get(u.id, weekAgo) as { count: number };

    const hl = db.prepare(
      'SELECT COALESCE(SUM(hours), 0) as total FROM effort_logs WHERE user_id = ? AND date >= ?'
    ).get(u.id, weekAgo) as { total: number };

    const goals = db.prepare(
      'SELECT COUNT(*) as count FROM goals WHERE user_id = ?'
    ).get(u.id) as { count: number };

    // Streak calculation
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasActivity = db.prepare(
        "SELECT 1 FROM tasks WHERE user_id = ? AND completed_at LIKE ? LIMIT 1"
      ).get(u.id, `${dateStr}%`) ||
      db.prepare(
        'SELECT 1 FROM effort_logs WHERE user_id = ? AND date = ? LIMIT 1'
      ).get(u.id, dateStr);
      if (hasActivity) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    return {
      user: {
        id: u.id,
        name: u.name,
        display_name: u.display_name,
        avatar_color: u.avatar_color,
      },
      tasksCompletedThisWeek: tc.count,
      hoursThisWeek: hl.total,
      streak,
      activeGoals: goals.count,
    };
  });
}

export function getFamilyWeeklyEffort(): { days: string[]; members: { name: string; color: string; hours: number[] }[] } {
  const db = getDb();
  const users = db.prepare('SELECT * FROM users ORDER BY created_at').all() as UserRow[];
  const days: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
  }

  const members = users.map((u) => {
    const hours: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const row = db.prepare(
        'SELECT COALESCE(SUM(hours), 0) as total FROM effort_logs WHERE user_id = ? AND date = ?'
      ).get(u.id, dateStr) as { total: number };
      hours.push(row.total);
    }
    return { name: u.display_name, color: u.avatar_color, hours };
  });

  return { days, members };
}

export function getFamilyRecentActivity(limit: number = 20): FamilyActivity[] {
  const db = getDb();
  const activities: FamilyActivity[] = [];

  // Recent completed tasks
  const completedTasks = db.prepare(`
    SELECT t.title, t.completed_at, u.display_name, u.avatar_color
    FROM tasks t JOIN users u ON t.user_id = u.id
    WHERE t.status = 'completed' AND t.completed_at IS NOT NULL
    ORDER BY t.completed_at DESC LIMIT ?
  `).all(limit) as { title: string; completed_at: string; display_name: string; avatar_color: string }[];

  for (const t of completedTasks) {
    activities.push({
      type: 'task_completed',
      userName: t.display_name,
      userColor: t.avatar_color,
      description: `Completed: ${t.title}`,
      timestamp: t.completed_at,
    });
  }

  // Recent effort logs
  const recentEfforts = db.prepare(`
    SELECT e.description, e.hours, e.date, e.created_at, u.display_name, u.avatar_color
    FROM effort_logs e JOIN users u ON e.user_id = u.id
    ORDER BY e.created_at DESC LIMIT ?
  `).all(limit) as { description: string; hours: number; date: string; created_at: string; display_name: string; avatar_color: string }[];

  for (const e of recentEfforts) {
    activities.push({
      type: 'effort_logged',
      userName: e.display_name,
      userColor: e.avatar_color,
      description: `Logged ${e.hours}h: ${e.description || 'work'}`,
      timestamp: e.created_at,
    });
  }

  // Sort by timestamp descending and limit
  activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return activities.slice(0, limit);
}
