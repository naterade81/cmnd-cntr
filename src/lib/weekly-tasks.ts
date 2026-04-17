import { getDb } from './sqlite';
import type { WeeklyTask, WeeklyTaskNested, DayOfWeek } from '@/types/weekly';

function now() {
  return new Date().toISOString();
}

// --- Queries ---

export function getWeeklyTasks(userId: number, weekStart: string): WeeklyTask[] {
  return getDb()
    .prepare('SELECT * FROM weekly_tasks WHERE user_id = ? AND week_start = ? ORDER BY day_of_week, project, sort_order')
    .all(userId, weekStart) as WeeklyTask[];
}

export function getWeeklyTask(id: number): WeeklyTask | undefined {
  return getDb().prepare('SELECT * FROM weekly_tasks WHERE id = ?').get(id) as WeeklyTask | undefined;
}

export function nestWeeklyTasks(flatTasks: WeeklyTask[]): WeeklyTaskNested[] {
  const taskMap = new Map<number, WeeklyTaskNested>();
  const roots: WeeklyTaskNested[] = [];

  for (const task of flatTasks) {
    taskMap.set(task.id, { ...task, children: [], childrenCompleted: 0, childrenTotal: 0 });
  }

  for (const task of flatTasks) {
    const nested = taskMap.get(task.id)!;
    if (task.parent_id && taskMap.has(task.parent_id)) {
      taskMap.get(task.parent_id)!.children.push(nested);
    } else {
      roots.push(nested);
    }
  }

  for (const task of roots) {
    if (task.children.length > 0) {
      task.childrenTotal = task.children.length;
      task.childrenCompleted = task.children.filter((c) => c.completed === 1).length;
    }
  }

  return roots;
}

export function getWeeklyTasksByDay(userId: number, weekStart: string) {
  const flat = getWeeklyTasks(userId, weekStart);
  const nested = nestWeeklyTasks(flat);
  const days: Record<DayOfWeek, WeeklyTaskNested[]> = {
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [],
  };
  for (const task of nested) {
    if (days[task.day_of_week]) {
      days[task.day_of_week].push(task);
    }
  }
  return days;
}

// --- Mutations ---

export function createWeeklyTask(
  userId: number,
  data: { week_start: string; day_of_week: DayOfWeek; project: string; title: string; parent_id?: number | null; sort_order?: number }
): WeeklyTask {
  const db = getDb();
  let sortOrder = data.sort_order ?? 0;
  if (data.sort_order === undefined) {
    const max = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM weekly_tasks WHERE user_id = ? AND week_start = ? AND day_of_week = ? AND project = ? AND parent_id IS ?'
    ).get(userId, data.week_start, data.day_of_week, data.project, data.parent_id ?? null) as { max_order: number };
    sortOrder = max.max_order + 1;
  }

  const result = db.prepare(
    `INSERT INTO weekly_tasks (user_id, week_start, day_of_week, project, title, parent_id, sort_order, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
  ).run(userId, data.week_start, data.day_of_week, data.project, data.title, data.parent_id ?? null, sortOrder);

  return getWeeklyTask(result.lastInsertRowid as number)!;
}

export function updateWeeklyTask(
  id: number,
  data: { title?: string; completed?: number; sort_order?: number; day_of_week?: DayOfWeek; project?: string }
): WeeklyTask | null {
  const task = getWeeklyTask(id);
  if (!task) return null;

  const db = getDb();
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.title !== undefined) { updates.push('title = ?'); params.push(data.title); }
  if (data.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(data.sort_order); }
  if (data.day_of_week !== undefined) { updates.push('day_of_week = ?'); params.push(data.day_of_week); }
  if (data.project !== undefined) { updates.push('project = ?'); params.push(data.project); }

  if (data.completed !== undefined) {
    updates.push('completed = ?');
    params.push(data.completed);

    if (data.completed === 1) {
      db.prepare('UPDATE weekly_tasks SET completed = 1, updated_at = ? WHERE parent_id = ?').run(now(), id);
    }

    if (task.parent_id) {
      const siblings = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM weekly_tasks WHERE parent_id = ?').get(task.parent_id) as { total: number; done: number };
      const adjustedDone = data.completed === 1 ? siblings.done + (task.completed === 0 ? 1 : 0) : siblings.done - (task.completed === 1 ? 1 : 0);
      const parentCompleted = adjustedDone >= siblings.total ? 1 : 0;
      db.prepare('UPDATE weekly_tasks SET completed = ?, updated_at = ? WHERE id = ?').run(parentCompleted, now(), task.parent_id);
    }
  }

  if (updates.length === 0) return task;

  updates.push('updated_at = ?');
  params.push(now());
  params.push(id);

  db.prepare(`UPDATE weekly_tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return getWeeklyTask(id)!;
}

export function deleteWeeklyTask(id: number) {
  getDb().prepare('DELETE FROM weekly_tasks WHERE id = ?').run(id);
}

export function reorderWeeklyTasks(tasks: { id: number; sort_order: number; project?: string }[]) {
  const db = getDb();
  const updateOrder = db.prepare('UPDATE weekly_tasks SET sort_order = ?, updated_at = ? WHERE id = ?');
  const updateOrderAndProject = db.prepare('UPDATE weekly_tasks SET sort_order = ?, project = ?, updated_at = ? WHERE id = ?');
  const timestamp = now();

  db.transaction(() => {
    for (const t of tasks) {
      if (t.project !== undefined) {
        updateOrderAndProject.run(t.sort_order, t.project, timestamp, t.id);
      } else {
        updateOrder.run(t.sort_order, timestamp, t.id);
      }
    }
  })();
}

export function rolloverWeeklyTasks(
  userId: number,
  newWeekStart: string,
  selections: { id: number; day_of_week: DayOfWeek }[]
) {
  const db = getDb();
  const created: WeeklyTask[] = [];

  db.transaction(() => {
    for (const sel of selections) {
      const original = getWeeklyTask(sel.id);
      if (!original || original.user_id !== userId) continue;

      const result = db.prepare(
        `INSERT INTO weekly_tasks (user_id, week_start, day_of_week, project, title, parent_id, sort_order, completed)
         VALUES (?, ?, ?, ?, ?, NULL, ?, 0)`
      ).run(userId, newWeekStart, sel.day_of_week, original.project, original.title, original.sort_order);
      const newParentId = result.lastInsertRowid as number;
      created.push(getWeeklyTask(newParentId)!);

      const children = db.prepare('SELECT * FROM weekly_tasks WHERE parent_id = ? AND completed = 0').all(original.id) as WeeklyTask[];
      for (const child of children) {
        db.prepare(
          `INSERT INTO weekly_tasks (user_id, week_start, day_of_week, project, title, parent_id, sort_order, completed)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
        ).run(userId, newWeekStart, sel.day_of_week, child.project, child.title, newParentId, child.sort_order);
      }
    }
  })();

  return created;
}

export function getIncompleteTasksForWeek(userId: number, weekStart: string): WeeklyTaskNested[] {
  const flat = getDb()
    .prepare('SELECT * FROM weekly_tasks WHERE user_id = ? AND week_start = ? AND completed = 0 AND parent_id IS NULL ORDER BY day_of_week, project, sort_order')
    .all(userId, weekStart) as WeeklyTask[];

  const result: WeeklyTaskNested[] = [];
  for (const task of flat) {
    const children = getDb()
      .prepare('SELECT * FROM weekly_tasks WHERE parent_id = ? AND completed = 0 ORDER BY sort_order')
      .all(task.id) as WeeklyTask[];

    result.push({
      ...task,
      children: children.map((c) => ({ ...c, children: [], childrenCompleted: 0, childrenTotal: 0 })),
      childrenCompleted: 0,
      childrenTotal: children.length,
    });
  }

  return result;
}

// --- Week helpers ---

export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

export function getPreviousWeekStart(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

export function getNextWeekStart(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export function getWeekEndFriday(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 4);
  return d.toISOString().split('T')[0];
}
