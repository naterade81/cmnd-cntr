# Weekly To-Do Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a weekly to-do planner with a dashboard widget, full-page planning view, drag-and-drop, and week rollover — completely separate from the existing tasks/ClickUp system.

**Architecture:** New `weekly_tasks` SQLite table with parent/child hierarchy. REST API at `/api/weekly-tasks`. Dashboard widget replaces RecentTasks with tabbed day view. Full-page `/weekly` route with 5-column layout. `@dnd-kit` for drag-and-drop reordering.

**Tech Stack:** Next.js 15, better-sqlite3, @dnd-kit/core + @dnd-kit/sortable, Tailwind CSS, lucide-react, date-fns

---

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `src/lib/weekly-tasks.ts` | DB functions: CRUD, rollover, reorder for weekly_tasks table |
| `src/types/weekly.ts` | TypeScript interfaces: WeeklyTask, WeeklyTaskNested |
| `src/app/api/weekly-tasks/route.ts` | GET (list by week) and POST (create) endpoints |
| `src/app/api/weekly-tasks/[id]/route.ts` | PATCH (update) and DELETE endpoints |
| `src/app/api/weekly-tasks/reorder/route.ts` | PATCH bulk reorder endpoint |
| `src/app/api/weekly-tasks/rollover/route.ts` | POST rollover endpoint |
| `src/components/weekly/WeeklyTodoWidget.tsx` | Dashboard widget: tabbed day view, compact |
| `src/components/weekly/WeeklyTaskItem.tsx` | Single task row with checkbox, progress indicator, drag handle |
| `src/components/weekly/WeeklyProjectGroup.tsx` | Project header + sortable task list within a project |
| `src/components/weekly/AddWeeklyTaskForm.tsx` | Inline add task form with project autocomplete |
| `src/components/weekly/RolloverModal.tsx` | Week rollover prompt modal |
| `src/app/weekly/page.tsx` | Full-page weekly planning view (server component) |
| `src/app/weekly/WeeklyPlannerClient.tsx` | Client component: 5-column layout with drag-and-drop |

### Modified Files
| File | Change |
|------|--------|
| `src/lib/sqlite.ts` | Add `weekly_tasks` table to schema + migration |
| `src/types/index.ts` | Re-export from `weekly.ts` |
| `src/app/page.tsx` | Fetch weekly tasks, pass to DashboardClient |
| `src/app/DashboardClient.tsx` | Replace RecentTasks with WeeklyTodoWidget |
| `src/components/Sidebar.tsx` | Add "Weekly" nav item |
| `package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @dnd-kit packages**

```bash
cd ~/personal/projects/personal-dashboard
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Verify installation**

```bash
cd ~/personal/projects/personal-dashboard
node -e "require('@dnd-kit/core'); console.log('dnd-kit installed')"
```

Expected: `dnd-kit installed`

---

## Task 2: Database Schema + Migration

**Files:**
- Modify: `src/lib/sqlite.ts:9-181`
- Create: `src/lib/weekly-tasks.ts`
- Create: `src/types/weekly.ts`

- [ ] **Step 1: Add weekly_tasks table to schema in sqlite.ts**

Add after the `tasks` indexes (after line 58) in the `SCHEMA_SQL` template literal:

```sql
-- Weekly Tasks
CREATE TABLE IF NOT EXISTS weekly_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  project TEXT NOT NULL,
  title TEXT NOT NULL,
  parent_id INTEGER REFERENCES weekly_tasks(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_user_week ON weekly_tasks(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_parent ON weekly_tasks(parent_id);
```

- [ ] **Step 2: Add migration logic for existing databases**

In the `getDb()` function in `sqlite.ts`, after the existing schema init block (after line 195), add a migration check:

```typescript
// Migrate: add weekly_tasks table if it doesn't exist
const weeklyCheck = _db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_tasks'").get();
if (!weeklyCheck) {
  _db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_start TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      project TEXT NOT NULL,
      title TEXT NOT NULL,
      parent_id INTEGER REFERENCES weekly_tasks(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_weekly_tasks_user_week ON weekly_tasks(user_id, week_start);
    CREATE INDEX IF NOT EXISTS idx_weekly_tasks_parent ON weekly_tasks(parent_id);
  `);
}
```

- [ ] **Step 3: Create TypeScript types in src/types/weekly.ts**

```typescript
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface WeeklyTask {
  id: number;
  user_id: number;
  week_start: string;
  day_of_week: DayOfWeek;
  project: string;
  title: string;
  parent_id: number | null;
  sort_order: number;
  completed: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface WeeklyTaskNested extends WeeklyTask {
  children: WeeklyTaskNested[];
  childrenCompleted: number;
  childrenTotal: number;
}

export interface WeeklyTasksByDay {
  monday: WeeklyTaskNested[];
  tuesday: WeeklyTaskNested[];
  wednesday: WeeklyTaskNested[];
  thursday: WeeklyTaskNested[];
  friday: WeeklyTaskNested[];
}
```

- [ ] **Step 4: Re-export weekly types from src/types/index.ts**

Add at the end of `src/types/index.ts`:

```typescript
export type { DayOfWeek, WeeklyTask, WeeklyTaskNested, WeeklyTasksByDay } from './weekly';
```

- [ ] **Step 5: Verify migration runs**

```bash
cd ~/personal/projects/personal-dashboard
node -e "
const { getDb } = require('./src/lib/sqlite');
const db = getDb();
const table = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_tasks'\").get();
console.log(table ? 'weekly_tasks table exists' : 'MISSING');
"
```

Expected: `weekly_tasks table exists`

---

## Task 3: Database Functions

**Files:**
- Create: `src/lib/weekly-tasks.ts`

- [ ] **Step 1: Create src/lib/weekly-tasks.ts with all DB functions**

```typescript
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

  // First pass: create nested objects
  for (const task of flatTasks) {
    taskMap.set(task.id, { ...task, children: [], childrenCompleted: 0, childrenTotal: 0 });
  }

  // Second pass: build tree
  for (const task of flatTasks) {
    const nested = taskMap.get(task.id)!;
    if (task.parent_id && taskMap.has(task.parent_id)) {
      taskMap.get(task.parent_id)!.children.push(nested);
    } else {
      roots.push(nested);
    }
  }

  // Third pass: compute child counts
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
  // Auto-calculate sort_order if not provided
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

    // If completing a parent, complete all children
    if (data.completed === 1) {
      db.prepare('UPDATE weekly_tasks SET completed = 1, updated_at = ? WHERE parent_id = ?').run(now(), id);
    }

    // If this is a child, recalculate parent completion
    if (task.parent_id) {
      const siblings = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM weekly_tasks WHERE parent_id = ?').get(task.parent_id) as { total: number; done: number };
      // Account for the current update (this task hasn't been updated in DB yet)
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
  // CASCADE handles children via foreign key
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

      // Copy parent task
      const result = db.prepare(
        `INSERT INTO weekly_tasks (user_id, week_start, day_of_week, project, title, parent_id, sort_order, completed)
         VALUES (?, ?, ?, ?, ?, NULL, ?, 0)`
      ).run(userId, newWeekStart, sel.day_of_week, original.project, original.title, original.sort_order);
      const newParentId = result.lastInsertRowid as number;
      created.push(getWeeklyTask(newParentId)!);

      // Copy incomplete children
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

  // Get children for each parent
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
  const day = now.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day; // Monday start
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
  d.setDate(d.getDate() + 4); // Monday + 4 = Friday
  return d.toISOString().split('T')[0];
}
```

- [ ] **Step 2: Verify the module compiles**

```bash
cd ~/personal/projects/personal-dashboard
npx tsc --noEmit src/lib/weekly-tasks.ts 2>&1 | head -20
```

Expected: No errors (or only pre-existing unrelated errors)

---

## Task 4: API Routes

**Files:**
- Create: `src/app/api/weekly-tasks/route.ts`
- Create: `src/app/api/weekly-tasks/[id]/route.ts`
- Create: `src/app/api/weekly-tasks/reorder/route.ts`
- Create: `src/app/api/weekly-tasks/rollover/route.ts`

- [ ] **Step 1: Create GET/POST route at src/app/api/weekly-tasks/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { getWeeklyTasksByDay, createWeeklyTask, getCurrentWeekStart } from '@/lib/weekly-tasks';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const weekStart = req.nextUrl.searchParams.get('week_start') || getCurrentWeekStart();
    const tasksByDay = getWeeklyTasksByDay(userId, weekStart);
    return NextResponse.json({ week_start: weekStart, tasks: tasksByDay });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    if (!body.title || !body.project || !body.day_of_week || !body.week_start) {
      return NextResponse.json({ error: 'title, project, day_of_week, and week_start are required' }, { status: 400 });
    }
    const task = createWeeklyTask(userId, body);
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
```

- [ ] **Step 2: Create PATCH/DELETE route at src/app/api/weekly-tasks/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { getWeeklyTask, updateWeeklyTask, deleteWeeklyTask } from '@/lib/weekly-tasks';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await params;
    const task = getWeeklyTask(parseInt(id));
    if (!task || task.user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const updated = updateWeeklyTask(parseInt(id), body);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await params;
    const task = getWeeklyTask(parseInt(id));
    if (!task || task.user_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    deleteWeeklyTask(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
```

- [ ] **Step 3: Create reorder route at src/app/api/weekly-tasks/reorder/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { reorderWeeklyTasks } from '@/lib/weekly-tasks';

export async function PATCH(req: NextRequest) {
  try {
    requireAuth(req);
    const body = await req.json();
    if (!Array.isArray(body.tasks)) {
      return NextResponse.json({ error: 'tasks array is required' }, { status: 400 });
    }
    reorderWeeklyTasks(body.tasks);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
```

- [ ] **Step 4: Create rollover route at src/app/api/weekly-tasks/rollover/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { rolloverWeeklyTasks, getIncompleteTasksForWeek } from '@/lib/weekly-tasks';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const weekStart = req.nextUrl.searchParams.get('week_start');
    if (!weekStart) return NextResponse.json({ error: 'week_start is required' }, { status: 400 });
    const incomplete = getIncompleteTasksForWeek(userId, weekStart);
    return NextResponse.json(incomplete);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    if (!body.new_week_start || !Array.isArray(body.tasks)) {
      return NextResponse.json({ error: 'new_week_start and tasks array required' }, { status: 400 });
    }
    const created = rolloverWeeklyTasks(userId, body.new_week_start, body.tasks);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
```

- [ ] **Step 5: Verify all routes compile**

```bash
cd ~/personal/projects/personal-dashboard
npx tsc --noEmit 2>&1 | grep -i "weekly" | head -20
```

Expected: No errors referencing weekly-tasks files

---

## Task 5: WeeklyTaskItem Component

**Files:**
- Create: `src/components/weekly/WeeklyTaskItem.tsx`

- [ ] **Step 1: Create the WeeklyTaskItem component**

```typescript
'use client';

import { useState } from 'react';
import { Check, GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WeeklyTaskNested } from '@/types/weekly';

interface Props {
  task: WeeklyTaskNested;
  isChild?: boolean;
  onToggle: (id: number, completed: number) => void;
  onDelete: (id: number) => void;
}

export default function WeeklyTaskItem({ task, isChild = false, onToggle, onDelete }: Props) {
  const [showDelete, setShowDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = task.children.length > 0;
  const isCompleted = task.completed === 1;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md group hover:bg-surface-card-hover transition-colors ${
          isChild ? 'ml-6' : ''
        }`}
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
      >
        {/* Drag handle */}
        <button {...attributes} {...listeners} className="text-text-muted opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
          <GripVertical size={14} />
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, isCompleted ? 0 : 1)}
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-brand-purple border-brand-purple'
              : 'border-surface-border-bright hover:border-brand-purple'
          }`}
        >
          {isCompleted && <Check size={10} className="text-white" />}
        </button>

        {/* Title */}
        <span
          className={`text-sm font-body flex-1 min-w-0 truncate ${
            isCompleted ? 'text-text-muted line-through' : 'text-text-primary'
          }`}
        >
          {task.title}
        </span>

        {/* Progress indicator for parents */}
        {hasChildren && (
          <span className="text-xs font-mono text-text-muted flex-shrink-0">
            {task.childrenCompleted}/{task.childrenTotal}
          </span>
        )}

        {/* Delete button */}
        {showDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="text-text-muted hover:text-brand-red transition-colors flex-shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && task.children.map((child) => (
        <WeeklyTaskItem key={child.id} task={child} isChild onToggle={onToggle} onDelete={onDelete} />
      ))}
    </div>
  );
}
```

---

## Task 6: WeeklyProjectGroup Component

**Files:**
- Create: `src/components/weekly/WeeklyProjectGroup.tsx`

- [ ] **Step 1: Create the WeeklyProjectGroup component**

```typescript
'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import WeeklyTaskItem from './WeeklyTaskItem';
import type { WeeklyTaskNested } from '@/types/weekly';

interface Props {
  project: string;
  tasks: WeeklyTaskNested[];
  onToggle: (id: number, completed: number) => void;
  onDelete: (id: number) => void;
}

export default function WeeklyProjectGroup({ project, tasks, onToggle, onDelete }: Props) {
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="mb-3">
      <h4 className="text-xs font-display font-semibold text-brand-purple uppercase tracking-wider px-2 mb-1">
        {project}
      </h4>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <WeeklyTaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </SortableContext>
    </div>
  );
}
```

---

## Task 7: AddWeeklyTaskForm Component

**Files:**
- Create: `src/components/weekly/AddWeeklyTaskForm.tsx`

- [ ] **Step 1: Create the inline add task form**

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import type { DayOfWeek, WeeklyTaskNested } from '@/types/weekly';

interface Props {
  weekStart: string;
  day: DayOfWeek;
  existingProjects: string[];
  existingTasks: WeeklyTaskNested[]; // top-level tasks for parent selection
  onAdd: (data: { week_start: string; day_of_week: DayOfWeek; project: string; title: string; parent_id?: number }) => void;
}

export default function AddWeeklyTaskForm({ weekStart, day, existingProjects, existingTasks, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [parentId, setParentId] = useState<number | undefined>(undefined);
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filteredProjects = existingProjects.filter(
    (p) => p.toLowerCase().includes(project.toLowerCase()) && p !== project
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !project.trim()) return;
    onAdd({ week_start: weekStart, day_of_week: day, project: project.trim(), title: title.trim(), parent_id: parentId });
    setTitle('');
    // Keep project for quick multi-add
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-purple transition-colors mt-2 px-2"
      >
        <Plus size={12} />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 px-2 space-y-2">
      {/* Project input with autocomplete */}
      <div className="relative">
        <input
          type="text"
          value={project}
          onChange={(e) => { setProject(e.target.value); setShowProjectSuggestions(true); }}
          onFocus={() => setShowProjectSuggestions(true)}
          onBlur={() => setTimeout(() => setShowProjectSuggestions(false), 150)}
          placeholder="Project"
          className="w-full bg-surface-card border border-surface-border rounded px-2 py-1 text-xs text-text-primary font-body placeholder:text-text-muted focus:border-brand-purple focus:outline-none"
        />
        {showProjectSuggestions && filteredProjects.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 bg-surface-card border border-surface-border rounded mt-0.5 max-h-24 overflow-y-auto">
            {filteredProjects.map((p) => (
              <button
                key={p}
                type="button"
                className="block w-full text-left px-2 py-1 text-xs text-text-primary hover:bg-surface-card-hover"
                onMouseDown={() => { setProject(p); setShowProjectSuggestions(false); }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title input */}
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full bg-surface-card border border-surface-border rounded px-2 py-1 text-xs text-text-primary font-body placeholder:text-text-muted focus:border-brand-purple focus:outline-none"
      />

      {/* Optional parent select */}
      {existingTasks.length > 0 && (
        <select
          value={parentId ?? ''}
          onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full bg-surface-card border border-surface-border rounded px-2 py-1 text-xs text-text-primary font-body focus:border-brand-purple focus:outline-none"
        >
          <option value="">No parent (top-level)</option>
          {existingTasks.map((t) => (
            <option key={t.id} value={t.id}>{t.project}: {t.title}</option>
          ))}
        </select>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button type="submit" className="bg-brand-purple text-white text-xs px-3 py-1 rounded hover:bg-brand-magenta transition-colors font-body">
          Add
        </button>
        <button type="button" onClick={() => { setOpen(false); setTitle(''); setProject(''); setParentId(undefined); }} className="text-text-muted hover:text-text-primary text-xs transition-colors">
          <X size={14} />
        </button>
      </div>
    </form>
  );
}
```

---

## Task 8: WeeklyTodoWidget (Dashboard)

**Files:**
- Create: `src/components/weekly/WeeklyTodoWidget.tsx`

- [ ] **Step 1: Create the dashboard widget component**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { CalendarRange } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import WeeklyProjectGroup from './WeeklyProjectGroup';
import AddWeeklyTaskForm from './AddWeeklyTaskForm';
import type { DayOfWeek, WeeklyTaskNested, WeeklyTasksByDay } from '@/types/weekly';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
];

interface Props {
  weekStart: string;
  initialTasks: WeeklyTasksByDay;
}

function getTodayDayKey(): DayOfWeek {
  const dayIndex = new Date().getDay(); // 0=Sun
  const map: Record<number, DayOfWeek> = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' };
  return map[dayIndex] || 'monday';
}

function groupByProject(tasks: WeeklyTaskNested[]): Record<string, WeeklyTaskNested[]> {
  const groups: Record<string, WeeklyTaskNested[]> = {};
  for (const task of tasks) {
    if (!groups[task.project]) groups[task.project] = [];
    groups[task.project].push(task);
  }
  return groups;
}

export default function WeeklyTodoWidget({ weekStart, initialTasks }: Props) {
  const [tasks, setTasks] = useState<WeeklyTasksByDay>(initialTasks);
  const [activeDay, setActiveDay] = useState<DayOfWeek>(getTodayDayKey());

  const weekEnd = format(addDays(parseISO(weekStart), 4), 'MMM d');
  const weekStartFormatted = format(parseISO(weekStart), 'MMM d');

  const dayTasks = tasks[activeDay] || [];
  const projectGroups = groupByProject(dayTasks);
  const allProjects = [...new Set(Object.values(tasks).flat().map((t) => t.project))];

  const refreshTasks = useCallback(async () => {
    const res = await fetch(`/api/weekly-tasks?week_start=${weekStart}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
  }, [weekStart]);

  async function handleToggle(id: number, completed: number) {
    await fetch(`/api/weekly-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    refreshTasks();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/weekly-tasks/${id}`, { method: 'DELETE' });
    refreshTasks();
  }

  async function handleAdd(data: { week_start: string; day_of_week: DayOfWeek; project: string; title: string; parent_id?: number }) {
    await fetch('/api/weekly-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    refreshTasks();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find the tasks in the current day and reorder
    const flatTasks = dayTasks.flatMap((t) => [t, ...t.children]);
    const activeTask = flatTasks.find((t) => t.id === active.id);
    const overTask = flatTasks.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;

    // Simple reorder: swap sort_order values
    await fetch('/api/weekly-tasks/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: [
          { id: activeTask.id, sort_order: overTask.sort_order },
          { id: overTask.id, sort_order: activeTask.sort_order },
        ],
      }),
    });
    refreshTasks();
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarRange size={16} className="text-brand-purple" />
          <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">
            Weekly To-Do
          </h3>
          <span className="text-xs text-text-muted font-mono">
            {weekStartFormatted} – {weekEnd}
          </span>
        </div>
        <a href="/weekly" className="text-brand-purple text-xs hover:text-brand-magenta transition-colors font-body">
          Full View
        </a>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1 mb-4">
        {DAYS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveDay(key)}
            className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors ${
              activeDay === key
                ? 'bg-brand-purple/15 text-brand-purple border border-brand-purple/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-card-hover'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {Object.keys(projectGroups).length === 0 ? (
            <p className="text-text-muted text-sm font-body py-4 text-center">No tasks for this day</p>
          ) : (
            Object.entries(projectGroups).map(([project, tasks]) => (
              <WeeklyProjectGroup key={project} project={project} tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
            ))
          )}
        </div>
      </DndContext>

      {/* Add Task */}
      <AddWeeklyTaskForm
        weekStart={weekStart}
        day={activeDay}
        existingProjects={allProjects}
        existingTasks={dayTasks.filter((t) => t.parent_id === null)}
        onAdd={handleAdd}
      />
    </div>
  );
}
```

---

## Task 9: RolloverModal Component

**Files:**
- Create: `src/components/weekly/RolloverModal.tsx`

- [ ] **Step 1: Create the rollover modal component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { DayOfWeek, WeeklyTaskNested } from '@/types/weekly';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
];

interface Props {
  previousWeekStart: string;
  newWeekStart: string;
  onComplete: () => void;
}

interface Selection {
  id: number;
  day_of_week: DayOfWeek;
  selected: boolean;
}

export default function RolloverModal({ previousWeekStart, newWeekStart, onComplete }: Props) {
  const [incompleteTasks, setIncompleteTasks] = useState<WeeklyTaskNested[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/weekly-tasks/rollover?week_start=${previousWeekStart}`);
      if (res.ok) {
        const tasks: WeeklyTaskNested[] = await res.json();
        setIncompleteTasks(tasks);
        setSelections(tasks.map((t) => ({ id: t.id, day_of_week: t.day_of_week, selected: true })));
      }
      setLoading(false);
    }
    load();
  }, [previousWeekStart]);

  function toggleSelect(id: number) {
    setSelections((prev) => prev.map((s) => s.id === id ? { ...s, selected: !s.selected } : s));
  }

  function toggleAll(selected: boolean) {
    setSelections((prev) => prev.map((s) => ({ ...s, selected })));
  }

  function updateDay(id: number, day: DayOfWeek) {
    setSelections((prev) => prev.map((s) => s.id === id ? { ...s, day_of_week: day } : s));
  }

  async function handleCarryOver() {
    const selected = selections.filter((s) => s.selected);
    if (selected.length > 0) {
      await fetch('/api/weekly-tasks/rollover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_week_start: newWeekStart, tasks: selected }),
      });
    }
    // Mark rollover as done
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekly_rollover_done: newWeekStart }),
    });
    onComplete();
  }

  async function handleStartFresh() {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekly_rollover_done: newWeekStart }),
    });
    onComplete();
  }

  if (loading) return null;
  if (incompleteTasks.length === 0) {
    // No incomplete tasks, auto-dismiss
    handleStartFresh();
    return null;
  }

  const allSelected = selections.every((s) => s.selected);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-primary border border-surface-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">New Week — Carry Over Tasks?</h2>
            <p className="text-xs text-text-muted font-body mt-0.5">
              {incompleteTasks.length} incomplete task{incompleteTasks.length !== 1 ? 's' : ''} from last week
            </p>
          </div>
          <button onClick={handleStartFresh} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        {/* Select All */}
        <div className="px-5 py-2 border-b border-surface-border">
          <button
            onClick={() => toggleAll(!allSelected)}
            className="text-xs text-brand-purple hover:text-brand-magenta font-body transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {incompleteTasks.map((task) => {
            const sel = selections.find((s) => s.id === task.id);
            if (!sel) return null;
            return (
              <div key={task.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-card">
                <input
                  type="checkbox"
                  checked={sel.selected}
                  onChange={() => toggleSelect(task.id)}
                  className="accent-brand-purple"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-body truncate">{task.title}</p>
                  <p className="text-xs text-text-muted font-mono">{task.project}</p>
                  {task.children.length > 0 && (
                    <p className="text-xs text-text-muted font-body mt-0.5">
                      + {task.children.length} sub-task{task.children.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <ArrowRight size={14} className="text-text-muted flex-shrink-0" />
                <select
                  value={sel.day_of_week}
                  onChange={(e) => updateDay(task.id, e.target.value as DayOfWeek)}
                  disabled={!sel.selected}
                  className="bg-surface-card border border-surface-border rounded px-2 py-1 text-xs text-text-primary font-body focus:border-brand-purple focus:outline-none disabled:opacity-40"
                >
                  {DAYS.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <button
            onClick={handleStartFresh}
            className="text-sm text-text-muted hover:text-text-primary font-body transition-colors"
          >
            Start Fresh
          </button>
          <button
            onClick={handleCarryOver}
            className="bg-brand-purple text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-magenta transition-colors font-body"
          >
            Carry Over Selected
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 10: Integrate Widget into Dashboard

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/DashboardClient.tsx`

- [ ] **Step 1: Update page.tsx to fetch weekly tasks**

Replace the contents of `src/app/page.tsx` with:

```typescript
import { redirect } from 'next/navigation';
import {
  getTasksDueToday,
  getTasksCompletedSince,
  getHoursSince,
  getActiveProjectCount,
  getStreak,
  getWeeklyEffort,
  getTrends,
  getProjectProgress,
  getSetting,
} from '@/lib/db';
import { getWeeklyTasksByDay, getCurrentWeekStart, getPreviousWeekStart } from '@/lib/weekly-tasks';
import { getAuthFromCookies } from '@/lib/auth';
import DashboardClient from './DashboardClient';
import type { DashboardStats } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/login');
  const { userId } = auth;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const stats: DashboardStats = {
    tasksToday: getTasksDueToday(userId),
    tasksCompleted: getTasksCompletedSince(userId, weekAgo),
    hoursThisWeek: getHoursSince(userId, weekAgo),
    activeProjects: getActiveProjectCount(userId),
    streak: getStreak(userId),
  };

  const weeklyEffort = getWeeklyEffort(userId);
  const trends = getTrends(userId);
  const projectProgress = getProjectProgress(userId);

  const weekStart = getCurrentWeekStart();
  const weeklyTasks = getWeeklyTasksByDay(userId, weekStart);

  // Check if rollover is needed
  const rolloverDone = getSetting(userId, 'weekly_rollover_done');
  const previousWeekStart = getPreviousWeekStart(weekStart);
  const needsRollover = rolloverDone !== weekStart;

  return (
    <DashboardClient
      stats={stats}
      weeklyEffort={weeklyEffort}
      trends={trends}
      projectProgress={projectProgress}
      weekStart={weekStart}
      weeklyTasks={weeklyTasks}
      needsRollover={needsRollover}
      previousWeekStart={previousWeekStart}
    />
  );
}
```

- [ ] **Step 2: Update DashboardClient.tsx to use WeeklyTodoWidget**

Replace the contents of `src/app/DashboardClient.tsx` with:

```typescript
'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, Flame, FolderOpen, ListTodo } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ProductivityChart from '@/components/charts/ProductivityChart';
import TrendsChart from '@/components/charts/TrendsChart';
import ProjectProgressChart from '@/components/charts/ProjectProgressChart';
import WeeklyTodoWidget from '@/components/weekly/WeeklyTodoWidget';
import MiniCalendar from '@/components/MiniCalendar';
import RolloverModal from '@/components/weekly/RolloverModal';
import type { DashboardStats, WeeklyEffort, TrendData, ProjectProgress, WeeklyTasksByDay } from '@/types';

interface Props {
  stats: DashboardStats;
  weeklyEffort: WeeklyEffort[];
  trends: TrendData[];
  projectProgress: ProjectProgress[];
  weekStart: string;
  weeklyTasks: WeeklyTasksByDay;
  needsRollover: boolean;
  previousWeekStart: string;
}

export default function DashboardClient({
  stats, weeklyEffort, trends, projectProgress,
  weekStart, weeklyTasks, needsRollover, previousWeekStart,
}: Props) {
  const [showRollover, setShowRollover] = useState(needsRollover);

  return (
    <div className="space-y-6">
      {/* Rollover Modal */}
      {showRollover && (
        <RolloverModal
          previousWeekStart={previousWeekStart}
          newWeekStart={weekStart}
          onComplete={() => { setShowRollover(false); window.location.reload(); }}
        />
      )}

      {/* Greeting */}
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Good {getGreeting()}, Nathan
        </h2>
        <p className="text-text-muted text-sm font-body mt-1">
          Here&apos;s your productivity overview
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard label="Due Today" value={stats.tasksToday} icon={ListTodo} color="#AF00F1" />
        <StatCard label="Completed (7d)" value={stats.tasksCompleted} icon={CheckCircle2} color="#4ade80" />
        <StatCard label="Hours (7d)" value={stats.hoursThisWeek.toFixed(1)} icon={Clock} color="#00e5ff" />
        <StatCard label="Active Projects" value={stats.activeProjects} icon={FolderOpen} color="#fbbf24" />
        <StatCard label="Streak" value={`${stats.streak}d`} icon={Flame} color="#f72585" subtitle="consecutive days" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ProductivityChart data={weeklyEffort} />
        <TrendsChart data={trends} />
      </div>

      {/* Bottom Row: Weekly To-Do + Project Progress + Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <WeeklyTodoWidget weekStart={weekStart} initialTasks={weeklyTasks} />
        <ProjectProgressChart projects={projectProgress} />
        <MiniCalendar />
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
```

---

## Task 11: Full-Page Weekly Planner

**Files:**
- Create: `src/app/weekly/page.tsx`
- Create: `src/app/weekly/WeeklyPlannerClient.tsx`

- [ ] **Step 1: Create server component at src/app/weekly/page.tsx**

```typescript
import { redirect } from 'next/navigation';
import { getAuthFromCookies } from '@/lib/auth';
import { getWeeklyTasksByDay, getCurrentWeekStart } from '@/lib/weekly-tasks';
import WeeklyPlannerClient from './WeeklyPlannerClient';

export const dynamic = 'force-dynamic';

export default async function WeeklyPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/login');
  const { userId } = auth;

  const weekStart = getCurrentWeekStart();
  const weeklyTasks = getWeeklyTasksByDay(userId, weekStart);

  return <WeeklyPlannerClient initialWeekStart={weekStart} initialTasks={weeklyTasks} />;
}
```

- [ ] **Step 2: Create client component at src/app/weekly/WeeklyPlannerClient.tsx**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragOverEvent, DragStartEvent, pointerWithin } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import WeeklyProjectGroup from '@/components/weekly/WeeklyProjectGroup';
import AddWeeklyTaskForm from '@/components/weekly/AddWeeklyTaskForm';
import type { DayOfWeek, WeeklyTaskNested, WeeklyTasksByDay } from '@/types/weekly';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
];

interface Props {
  initialWeekStart: string;
  initialTasks: WeeklyTasksByDay;
}

function groupByProject(tasks: WeeklyTaskNested[]): Record<string, WeeklyTaskNested[]> {
  const groups: Record<string, WeeklyTaskNested[]> = {};
  for (const task of tasks) {
    if (!groups[task.project]) groups[task.project] = [];
    groups[task.project].push(task);
  }
  return groups;
}

export default function WeeklyPlannerClient({ initialWeekStart, initialTasks }: Props) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [tasks, setTasks] = useState<WeeklyTasksByDay>(initialTasks);

  const weekEnd = format(addDays(parseISO(weekStart), 4), 'MMM d');
  const weekStartFormatted = format(parseISO(weekStart), 'MMM d, yyyy');

  const allProjects = [...new Set(Object.values(tasks).flat().map((t) => t.project))];

  const refreshTasks = useCallback(async (ws?: string) => {
    const targetWeek = ws || weekStart;
    const res = await fetch(`/api/weekly-tasks?week_start=${targetWeek}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
  }, [weekStart]);

  async function navigateWeek(direction: -1 | 1) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + direction * 7);
    const newWeek = d.toISOString().split('T')[0];
    setWeekStart(newWeek);
    refreshTasks(newWeek);
  }

  async function handleToggle(id: number, completed: number) {
    await fetch(`/api/weekly-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    refreshTasks();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/weekly-tasks/${id}`, { method: 'DELETE' });
    refreshTasks();
  }

  async function handleAdd(data: { week_start: string; day_of_week: DayOfWeek; project: string; title: string; parent_id?: number }) {
    await fetch('/api/weekly-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    refreshTasks();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const allFlat = Object.values(tasks).flat().flatMap((t) => [t, ...t.children]);
    const activeTask = allFlat.find((t) => t.id === active.id);
    const overTask = allFlat.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;

    const reorderPayload: { id: number; sort_order: number; project?: string }[] = [
      { id: activeTask.id, sort_order: overTask.sort_order },
      { id: overTask.id, sort_order: activeTask.sort_order },
    ];

    // If tasks are on different days, also update day_of_week
    if (activeTask.day_of_week !== overTask.day_of_week) {
      await fetch(`/api/weekly-tasks/${activeTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: overTask.day_of_week }),
      });
    }

    await fetch('/api/weekly-tasks/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: reorderPayload }),
    });
    refreshTasks();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary">Weekly Plan</h2>
          <p className="text-text-muted text-sm font-body mt-1">
            {weekStartFormatted} – {weekEnd}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => { const now = new Date(); const day = now.getDay(); const diff = day === 0 ? -6 : 1 - day; const monday = new Date(now); monday.setDate(now.getDate() + diff); const ws = monday.toISOString().split('T')[0]; setWeekStart(ws); refreshTasks(ws); }}
            className="px-3 py-2 rounded-lg border border-surface-border text-xs text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors font-body"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 5-Column Layout */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4">
          {DAYS.map(({ key, label }) => {
            const dayTasks = tasks[key] || [];
            const projectGroups = groupByProject(dayTasks);
            const isToday = key === (() => { const d = new Date().getDay(); const map: Record<number, DayOfWeek> = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' }; return map[d] || ''; })();

            return (
              <div
                key={key}
                className={`bg-surface-card border rounded-xl p-4 min-h-[400px] flex flex-col ${
                  isToday ? 'border-brand-purple/40' : 'border-surface-border'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-display text-sm font-semibold uppercase tracking-wider ${
                    isToday ? 'text-brand-purple' : 'text-text-primary'
                  }`}>
                    {label}
                  </h3>
                  {isToday && (
                    <span className="w-2 h-2 rounded-full bg-brand-purple" />
                  )}
                </div>

                {/* Tasks */}
                <div className="flex-1 space-y-1">
                  {Object.keys(projectGroups).length === 0 ? (
                    <p className="text-text-muted text-xs font-body py-4 text-center">No tasks</p>
                  ) : (
                    Object.entries(projectGroups).map(([project, tasks]) => (
                      <WeeklyProjectGroup key={project} project={project} tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
                    ))
                  )}
                </div>

                {/* Add Task */}
                <AddWeeklyTaskForm
                  weekStart={weekStart}
                  day={key}
                  existingProjects={allProjects}
                  existingTasks={dayTasks.filter((t) => t.parent_id === null)}
                  onAdd={handleAdd}
                />
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
```

---

## Task 12: Add Weekly to Sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx:23-34`

- [ ] **Step 1: Add Weekly nav item to the sidebar**

In `src/components/Sidebar.tsx`, add the `CalendarRange` import to the lucide-react imports (line 11), and add the Weekly item to the `navItems` array after the Dashboard entry:

Add to imports:
```typescript
CalendarRange,
```

Add to `navItems` array after `{ href: '/', label: 'Dashboard', icon: LayoutDashboard }`:
```typescript
{ href: '/weekly', label: 'Weekly', icon: CalendarRange },
```

---

## Task 13: Re-export Weekly Types + Final Type Check

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Verify the re-export was added in Task 2 Step 4**

Check that `src/types/index.ts` contains:
```typescript
export type { DayOfWeek, WeeklyTask, WeeklyTaskNested, WeeklyTasksByDay } from './weekly';
```

- [ ] **Step 2: Run full type check**

```bash
cd ~/personal/projects/personal-dashboard
npx tsc --noEmit 2>&1 | tail -20
```

Expected: No new errors related to weekly-tasks files

- [ ] **Step 3: Start dev server and verify**

```bash
cd ~/personal/projects/personal-dashboard
npm run dev
```

Verify:
1. Dashboard loads without errors
2. Weekly To-Do widget appears in the bottom row (replacing Recent Tasks)
3. `/weekly` page loads with 5-column layout
4. Sidebar shows "Weekly" nav item
5. Can add a task via the inline form
6. Can check/uncheck tasks
7. Drag handle appears on hover
