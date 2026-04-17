import { getDb } from './sqlite';

// --- Interfaces (unchanged from previous) ---

export interface CalendarEventRow {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
  calendar: string;
  color: string;
  htmlLink: string | null;
}

export interface BudgetCategoryRow {
  section: string;
  category: string;
  subcategory: string;
  budgeted: number;
  frequency: string;
  dueDate: string;
  autoPay: boolean;
  notes: string;
}

export interface TransactionRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  bankCategory: string;
  budgetCategory: string;
  method: string;
  balance: number;
  source: 'bank' | 'daily_log' | 'manual';
}

export interface DebtRow {
  name: string;
  details: string;
  balance: number;
  monthlyPayment: number;
  extraPayment: number;
  projectedPayoff: string;
  priority: string;
}

export interface SavingsGoalRow {
  name: string;
  description: string;
  target: number;
  current: number;
  monthlyContribution: number;
  targetDate: string;
  phase: string;
}

export interface TaskRow {
  id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  project: string | null;
  scheduled_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  clickup_id: string | null;
  clickup_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EffortLogRow {
  id: number;
  category: string;
  project: string | null;
  hours: number;
  description: string | null;
  date: string;
  created_at: string;
}

export interface GoalRow {
  id: number;
  title: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRow {
  id: number;
  name: string;
  display_name: string;
  pin_hash: string;
  role: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

// --- Helpers ---

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// --- Users ---

export function getUserById(id: number): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function getUserByName(name: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE name = ?').get(name) as UserRow | undefined;
}

export function getAllUsers(): UserRow[] {
  return getDb().prepare('SELECT * FROM users ORDER BY created_at').all() as UserRow[];
}

export function createUser(data: { name: string; display_name: string; pin_hash: string; role?: string; avatar_color?: string }): UserRow {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO users (name, display_name, pin_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?)'
  ).run(data.name, data.display_name, data.pin_hash, data.role || 'member', data.avatar_color || '#AF00F1');
  return getUserById(result.lastInsertRowid as number)!;
}

export function deleteUser(id: number) {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
}

// --- Sessions ---

export function createSession(id: string, userId: number, expiresAt: string) {
  getDb().prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt);
}

export function getSession(id: string): { id: string; user_id: number; expires_at: string } | undefined {
  return getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id) as { id: string; user_id: number; expires_at: string } | undefined;
}

export function deleteSession(id: string) {
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

export function deleteExpiredSessions() {
  getDb().prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
}

// --- Invite Tokens ---

export function createInviteToken(token: string, createdBy: number, expiresAt: string) {
  getDb().prepare('INSERT INTO invite_tokens (token, created_by, expires_at) VALUES (?, ?, ?)').run(token, createdBy, expiresAt);
}

export function getInviteToken(token: string): { id: number; token: string; created_by: number; used_by: number | null; expires_at: string } | undefined {
  return getDb().prepare('SELECT * FROM invite_tokens WHERE token = ? AND used_by IS NULL AND expires_at > ?').get(token, now()) as ReturnType<typeof getInviteToken>;
}

export function markInviteTokenUsed(token: string, usedBy: number) {
  getDb().prepare('UPDATE invite_tokens SET used_by = ? WHERE token = ?').run(usedBy, token);
}

export function getActiveInviteTokens(createdBy: number) {
  return getDb().prepare('SELECT * FROM invite_tokens WHERE created_by = ? AND used_by IS NULL AND expires_at > ? ORDER BY created_at DESC').all(createdBy, now());
}

// --- Tasks ---

export function getAllTasks(userId: number, filters?: { category?: string; status?: string }): TaskRow[] {
  let sql = 'SELECT * FROM tasks WHERE user_id = ?';
  const params: (string | number)[] = [userId];
  if (filters?.category) { sql += ' AND category = ?'; params.push(filters.category); }
  if (filters?.status) { sql += ' AND status = ?'; params.push(filters.status); }
  sql += ' ORDER BY CASE status WHEN \'in_progress\' THEN 0 WHEN \'pending\' THEN 1 WHEN \'completed\' THEN 2 ELSE 9 END, CASE priority WHEN \'urgent\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 WHEN \'low\' THEN 3 ELSE 9 END';
  return getDb().prepare(sql).all(...params) as TaskRow[];
}

export function getTask(id: number): TaskRow | undefined {
  return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
}

export function createTask(userId: number, data: { title: string; description?: string | null; category?: string; priority?: string; project?: string | null; scheduled_date?: string | null; due_date?: string | null }): TaskRow {
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO tasks (user_id, title, description, category, status, priority, project, scheduled_date, due_date, completed_at, clickup_id, clickup_url)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, NULL, NULL, NULL)`
  ).run(
    userId, data.title, data.description || null, data.category || 'professional',
    data.priority || 'medium', data.project || null, data.scheduled_date || null, data.due_date || null
  );
  return getTask(result.lastInsertRowid as number)!;
}

export function updateTask(id: number, data: Partial<TaskRow>): TaskRow | null {
  const task = getTask(id);
  if (!task) return null;

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  for (const key of ['title', 'description', 'category', 'status', 'priority', 'project', 'scheduled_date', 'due_date'] as const) {
    if ((data as Record<string, unknown>)[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push((data as Record<string, unknown>)[key] as string | null);
    }
  }

  if (data.status === 'completed') {
    updates.push('completed_at = ?');
    params.push(now());
  } else if (data.status && data.status !== 'completed') {
    updates.push('completed_at = NULL');
  }

  updates.push('updated_at = ?');
  params.push(now());
  params.push(id);

  getDb().prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return getTask(id)!;
}

export function deleteTask(id: number) {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function upsertTaskByClickupId(userId: number, clickupId: string, data: Partial<TaskRow>): TaskRow {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM tasks WHERE clickup_id = ? AND user_id = ?').get(clickupId, userId) as TaskRow | undefined;

  if (existing) {
    const updates: string[] = [];
    const params: (string | number | null)[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (key === 'id' || key === 'clickup_id' || key === 'user_id') continue;
      updates.push(`${key} = ?`);
      params.push(val as string | number | null);
    }
    updates.push('updated_at = ?');
    params.push(now());
    params.push(existing.id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return getTask(existing.id)!;
  } else {
    const result = db.prepare(
      `INSERT INTO tasks (user_id, title, description, category, status, priority, project, scheduled_date, due_date, completed_at, clickup_id, clickup_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId, data.title || 'Untitled', data.description || null, data.category || 'professional',
      data.status || 'pending', data.priority || 'medium', data.project || null,
      data.scheduled_date || null, data.due_date || null,
      data.status === 'completed' ? now() : null,
      clickupId, data.clickup_url || `https://app.clickup.com/t/${clickupId}`
    );
    return getTask(result.lastInsertRowid as number)!;
  }
}

// --- Effort Logs ---

export function getEffortLogs(userId: number, days: number = 30): EffortLogRow[] {
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  return getDb().prepare('SELECT * FROM effort_logs WHERE user_id = ? AND date >= ? ORDER BY date DESC').all(userId, since) as EffortLogRow[];
}

export function createEffortLog(userId: number, data: { category?: string; project?: string | null; hours: number; description?: string | null; date?: string }): EffortLogRow {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO effort_logs (user_id, category, project, hours, description, date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, data.category || 'professional', data.project || null, data.hours, data.description || null, data.date || today());
  return db.prepare('SELECT * FROM effort_logs WHERE id = ?').get(result.lastInsertRowid) as EffortLogRow;
}

// --- Goals ---

export function getAllGoals(userId: number): GoalRow[] {
  return getDb().prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(userId) as GoalRow[];
}

export function getGoal(id: number): GoalRow | undefined {
  return getDb().prepare('SELECT * FROM goals WHERE id = ?').get(id) as GoalRow | undefined;
}

export function createGoal(userId: number, data: { title: string; category?: string; target_value: number; unit?: string; end_date?: string | null }): GoalRow {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO goals (user_id, title, category, target_value, current_value, unit, start_date, end_date) VALUES (?, ?, ?, ?, 0, ?, ?, ?)'
  ).run(userId, data.title, data.category || 'professional', data.target_value, data.unit || 'tasks', today(), data.end_date || null);
  return getGoal(result.lastInsertRowid as number)!;
}

export function updateGoal(id: number, data: Partial<GoalRow>): GoalRow | null {
  const goal = getGoal(id);
  if (!goal) return null;

  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  for (const key of ['title', 'category', 'target_value', 'current_value', 'unit', 'end_date'] as const) {
    if ((data as Record<string, unknown>)[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push((data as Record<string, unknown>)[key] as string | number | null);
    }
  }
  updates.push('updated_at = ?');
  params.push(now());
  params.push(id);

  getDb().prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return getGoal(id)!;
}

export function deleteGoal(id: number) {
  getDb().prepare('DELETE FROM goals WHERE id = ?').run(id);
}

// --- Settings (per-user) ---

export function getSetting(userId: number, key: string): string | undefined {
  const row = getDb().prepare('SELECT value FROM user_settings WHERE user_id = ? AND key = ?').get(userId, key) as { value: string } | undefined;
  return row?.value;
}

export function getAllSettings(userId: number): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM user_settings WHERE user_id = ?').all(userId) as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) result[row.key] = row.value;
  return result;
}

export function setSetting(userId: number, key: string, value: string) {
  getDb().prepare('INSERT OR REPLACE INTO user_settings (user_id, key, value) VALUES (?, ?, ?)').run(userId, key, value);
}

export function setSettings(userId: number, entries: Record<string, string>) {
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO user_settings (user_id, key, value) VALUES (?, ?, ?)');
  const batch = db.transaction((entries: [string, string][]) => {
    for (const [key, value] of entries) stmt.run(userId, key, value);
  });
  batch(Object.entries(entries));
}

// --- Dashboard Stats ---

export function getTasksDueToday(userId: number): number {
  const t = today();
  const row = getDb().prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date = ? AND status != \'completed\'').get(userId, t) as { count: number };
  return row.count;
}

export function getTasksCompletedSince(userId: number, since: string): number {
  const row = getDb().prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = \'completed\' AND completed_at >= ?').get(userId, since) as { count: number };
  return row.count;
}

export function getHoursSince(userId: number, since: string): number {
  const row = getDb().prepare('SELECT COALESCE(SUM(hours), 0) as total FROM effort_logs WHERE user_id = ? AND date >= ?').get(userId, since) as { total: number };
  return row.total;
}

export function getActiveProjectCount(userId: number): number {
  const row = getDb().prepare('SELECT COUNT(DISTINCT project) as count FROM tasks WHERE user_id = ? AND project IS NOT NULL AND status != \'completed\'').get(userId) as { count: number };
  return row.count;
}

export function getStreak(userId: number): number {
  const db = getDb();
  let streak = 0;
  let checkDate = new Date();

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasTask = db.prepare('SELECT 1 FROM tasks WHERE user_id = ? AND completed_at LIKE ? LIMIT 1').get(userId, `${dateStr}%`);
    const hasEffort = db.prepare('SELECT 1 FROM effort_logs WHERE user_id = ? AND date = ? LIMIT 1').get(userId, dateStr);
    if (hasTask || hasEffort) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }
  return streak;
}

export function getWeeklyEffort(userId: number) {
  const db = getDb();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const pro = db.prepare('SELECT COALESCE(SUM(hours), 0) as total FROM effort_logs WHERE user_id = ? AND date = ? AND category = \'professional\'').get(userId, dateStr) as { total: number };
    const per = db.prepare('SELECT COALESCE(SUM(hours), 0) as total FROM effort_logs WHERE user_id = ? AND date = ? AND category = \'personal\'').get(userId, dateStr) as { total: number };
    result.push({ day: dayName, professional: pro.total, personal: per.total });
  }
  return result;
}

export function getTrends(userId: number) {
  const db = getDb();
  const result = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(Date.now() - (i * 7 + 6) * 86400000).toISOString().split('T')[0];
    const weekEnd = new Date(Date.now() - i * 7 * 86400000).toISOString().split('T')[0];
    const tc = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = \'completed\' AND completed_at >= ? AND completed_at < ?').get(userId, weekStart, weekEnd) as { count: number };
    const hl = db.prepare('SELECT COALESCE(SUM(hours), 0) as total FROM effort_logs WHERE user_id = ? AND date >= ? AND date < ?').get(userId, weekStart, weekEnd) as { total: number };
    result.push({ week: `W${8 - i}`, tasksCompleted: tc.count, hoursLogged: hl.total });
  }
  return result;
}

export function getProjectProgress(userId: number) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT project, category,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM tasks WHERE user_id = ? AND project IS NOT NULL
    GROUP BY project, category
    ORDER BY total DESC LIMIT 8
  `).all(userId) as { project: string; category: string; total: number; completed: number }[];

  return rows.map((r) => ({
    name: r.project,
    category: r.category as 'professional' | 'personal',
    total: r.total,
    completed: r.completed,
    percentage: Math.round((r.completed / r.total) * 100),
  }));
}

// --- Calendar Events ---

export function getCalendarEvents(userId: number, dateFrom?: string, dateTo?: string): CalendarEventRow[] {
  let sql = 'SELECT * FROM calendar_events WHERE user_id = ?';
  const params: (string | number)[] = [userId];
  if (dateFrom) { sql += ' AND (start >= ? OR end >= ?)'; params.push(dateFrom, dateFrom); }
  if (dateTo) { sql += ' AND start <= ?'; params.push(dateTo); }
  sql += ' ORDER BY start';

  const rows = getDb().prepare(sql).all(...params) as (Omit<CalendarEventRow, 'allDay' | 'htmlLink'> & { all_day: number; html_link: string | null })[];
  return rows.map((r) => ({
    id: r.id,
    summary: r.summary,
    start: r.start,
    end: r.end,
    allDay: r.all_day === 1,
    location: r.location,
    description: r.description,
    calendar: r.calendar,
    color: r.color,
    htmlLink: r.html_link,
  }));
}

export function syncCalendarEvents(userId: number, events: CalendarEventRow[]) {
  const db = getDb();
  const calendarsBeingSynced = new Set(events.map((e) => e.calendar));

  const deleteStmt = db.prepare('DELETE FROM calendar_events WHERE user_id = ? AND calendar = ?');
  const insertStmt = db.prepare(
    'INSERT INTO calendar_events (id, user_id, summary, start, end, all_day, location, description, calendar, color, html_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  db.transaction(() => {
    for (const cal of calendarsBeingSynced) deleteStmt.run(userId, cal);
    for (const e of events) {
      insertStmt.run(e.id, userId, e.summary, e.start, e.end, e.allDay ? 1 : 0, e.location, e.description, e.calendar, e.color, e.htmlLink);
    }
    db.prepare('INSERT OR REPLACE INTO sync_metadata (user_id, sync_type, synced_at) VALUES (?, \'calendar\', ?)').run(userId, now());
  })();
}

export function getCalendarSyncedAt(userId: number): string | null {
  const row = getDb().prepare('SELECT synced_at FROM sync_metadata WHERE user_id = ? AND sync_type = \'calendar\'').get(userId) as { synced_at: string } | undefined;
  return row?.synced_at || null;
}

// --- Budget ---

export function getBudgetCategories(userId: number): BudgetCategoryRow[] {
  const rows = getDb().prepare('SELECT * FROM budget_categories WHERE user_id = ?').all(userId) as (BudgetCategoryRow & { due_date: string; auto_pay: number })[];
  return rows.map((r) => ({
    section: r.section,
    category: r.category,
    subcategory: r.subcategory,
    budgeted: r.budgeted,
    frequency: r.frequency,
    dueDate: r.due_date,
    autoPay: r.auto_pay === 1,
    notes: r.notes,
  }));
}

export function syncBudgetCategories(userId: number, categories: BudgetCategoryRow[]) {
  const db = getDb();
  const deleteStmt = db.prepare('DELETE FROM budget_categories WHERE user_id = ?');
  const insertStmt = db.prepare(
    'INSERT INTO budget_categories (user_id, section, category, subcategory, budgeted, frequency, due_date, auto_pay, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  db.transaction(() => {
    deleteStmt.run(userId);
    for (const c of categories) {
      insertStmt.run(userId, c.section, c.category, c.subcategory, c.budgeted, c.frequency, c.dueDate, c.autoPay ? 1 : 0, c.notes);
    }
    db.prepare('INSERT OR REPLACE INTO sync_metadata (user_id, sync_type, synced_at) VALUES (?, \'budget\', ?)').run(userId, now());
  })();
}

export function getTransactions(userId: number, dateFrom?: string, dateTo?: string): TransactionRow[] {
  let sql = 'SELECT * FROM transactions WHERE user_id = ?';
  const params: (string | number)[] = [userId];
  if (dateFrom) { sql += ' AND date >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND date <= ?'; params.push(dateTo); }
  sql += ' ORDER BY date DESC';

  const rows = getDb().prepare(sql).all(...params) as (Omit<TransactionRow, 'bankCategory' | 'budgetCategory'> & { bank_category: string; budget_category: string })[];
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    description: r.description,
    amount: r.amount,
    type: r.type as 'credit' | 'debit',
    bankCategory: r.bank_category,
    budgetCategory: r.budget_category,
    method: r.method,
    balance: r.balance,
    source: r.source as 'bank' | 'daily_log' | 'manual',
  }));
}

export function syncTransactions(userId: number, transactions: TransactionRow[]) {
  const db = getDb();
  const upsertStmt = db.prepare(
    `INSERT OR REPLACE INTO transactions (id, user_id, date, description, amount, type, bank_category, budget_category, method, balance, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.transaction(() => {
    for (const t of transactions) {
      upsertStmt.run(t.id, userId, t.date, t.description, t.amount, t.type, t.bankCategory, t.budgetCategory, t.method, t.balance, t.source);
    }
    db.prepare('INSERT OR REPLACE INTO sync_metadata (user_id, sync_type, synced_at) VALUES (?, \'budget\', ?)').run(userId, now());
  })();
}

export function addManualTransaction(userId: number, txn: Omit<TransactionRow, 'id' | 'source'>): TransactionRow {
  const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  getDb().prepare(
    `INSERT INTO transactions (id, user_id, date, description, amount, type, bank_category, budget_category, method, balance, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')`
  ).run(id, userId, txn.date, txn.description, txn.amount, txn.type, txn.bankCategory, txn.budgetCategory, txn.method, txn.balance);

  return { ...txn, id, source: 'manual' };
}

export function getDebts(userId: number): DebtRow[] {
  const rows = getDb().prepare('SELECT * FROM debts WHERE user_id = ?').all(userId) as { name: string; details: string; balance: number; monthly_payment: number; extra_payment: number; projected_payoff: string; priority: string }[];
  return rows.map((r) => ({
    name: r.name,
    details: r.details,
    balance: r.balance,
    monthlyPayment: r.monthly_payment,
    extraPayment: r.extra_payment,
    projectedPayoff: r.projected_payoff,
    priority: r.priority,
  }));
}

export function syncDebts(userId: number, debts: DebtRow[]) {
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM debts WHERE user_id = ?').run(userId);
    const stmt = db.prepare('INSERT INTO debts (user_id, name, details, balance, monthly_payment, extra_payment, projected_payoff, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const d of debts) stmt.run(userId, d.name, d.details, d.balance, d.monthlyPayment, d.extraPayment, d.projectedPayoff, d.priority);
    db.prepare('INSERT OR REPLACE INTO sync_metadata (user_id, sync_type, synced_at) VALUES (?, \'budget\', ?)').run(userId, now());
  })();
}

export function updateDebt(userId: number, name: string, data: Partial<DebtRow>): DebtRow | null {
  const existing = getDb().prepare('SELECT * FROM debts WHERE user_id = ? AND name = ?').get(userId, name);
  if (!existing) return null;

  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  const fieldMap: Record<string, string> = { details: 'details', balance: 'balance', monthlyPayment: 'monthly_payment', extraPayment: 'extra_payment', projectedPayoff: 'projected_payoff', priority: 'priority' };
  for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
    if ((data as Record<string, unknown>)[jsKey] !== undefined) {
      updates.push(`${dbKey} = ?`);
      params.push((data as Record<string, unknown>)[jsKey] as string | number | null);
    }
  }
  if (updates.length === 0) return getDebts(userId).find((d) => d.name === name) || null;
  params.push(userId, name);
  getDb().prepare(`UPDATE debts SET ${updates.join(', ')} WHERE user_id = ? AND name = ?`).run(...params);
  return getDebts(userId).find((d) => d.name === name) || null;
}

export function getSavingsGoals(userId: number): SavingsGoalRow[] {
  const rows = getDb().prepare('SELECT * FROM savings_goals WHERE user_id = ?').all(userId) as { name: string; description: string; target: number; current: number; monthly_contribution: number; target_date: string; phase: string }[];
  return rows.map((r) => ({
    name: r.name,
    description: r.description,
    target: r.target,
    current: r.current,
    monthlyContribution: r.monthly_contribution,
    targetDate: r.target_date,
    phase: r.phase,
  }));
}

export function syncSavingsGoals(userId: number, goals: SavingsGoalRow[]) {
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM savings_goals WHERE user_id = ?').run(userId);
    const stmt = db.prepare('INSERT INTO savings_goals (user_id, name, description, target, current, monthly_contribution, target_date, phase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const g of goals) stmt.run(userId, g.name, g.description, g.target, g.current, g.monthlyContribution, g.targetDate, g.phase);
    db.prepare('INSERT OR REPLACE INTO sync_metadata (user_id, sync_type, synced_at) VALUES (?, \'budget\', ?)').run(userId, now());
  })();
}

export function updateSavingsGoal(userId: number, name: string, data: Partial<SavingsGoalRow>): SavingsGoalRow | null {
  const existing = getDb().prepare('SELECT * FROM savings_goals WHERE user_id = ? AND name = ?').get(userId, name);
  if (!existing) return null;

  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  const fieldMap: Record<string, string> = { description: 'description', target: 'target', current: 'current', monthlyContribution: 'monthly_contribution', targetDate: 'target_date', phase: 'phase' };
  for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
    if ((data as Record<string, unknown>)[jsKey] !== undefined) {
      updates.push(`${dbKey} = ?`);
      params.push((data as Record<string, unknown>)[jsKey] as string | number | null);
    }
  }
  if (updates.length === 0) return getSavingsGoals(userId).find((g) => g.name === name) || null;
  params.push(userId, name);
  getDb().prepare(`UPDATE savings_goals SET ${updates.join(', ')} WHERE user_id = ? AND name = ?`).run(...params);
  return getSavingsGoals(userId).find((g) => g.name === name) || null;
}

export function getBudgetSyncedAt(userId: number): string | null {
  const row = getDb().prepare('SELECT synced_at FROM sync_metadata WHERE user_id = ? AND sync_type = \'budget\'').get(userId) as { synced_at: string } | undefined;
  return row?.synced_at || null;
}
