import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');

let _db: Database.Database | null = null;

const SCHEMA_SQL = `
-- Users & Auth
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  avatar_color TEXT DEFAULT '#AF00F1',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invite_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  used_by INTEGER REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'professional',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  project TEXT,
  scheduled_date TEXT,
  due_date TEXT,
  completed_at TEXT,
  clickup_id TEXT,
  clickup_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_clickup ON tasks(clickup_id);

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

-- Effort Logs
CREATE TABLE IF NOT EXISTS effort_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'professional',
  project TEXT,
  hours REAL NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_efforts_user_date ON effort_logs(user_id, date);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'professional',
  target_value REAL NOT NULL,
  current_value REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'tasks',
  start_date TEXT NOT NULL,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  all_day INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  description TEXT,
  calendar TEXT,
  color TEXT,
  html_link TEXT,
  PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_calendar_user ON calendar_events(user_id);

-- Budget Categories
CREATE TABLE IF NOT EXISTS budget_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  budgeted REAL NOT NULL,
  frequency TEXT,
  due_date TEXT,
  auto_pay INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_budget_user ON budget_categories(user_id);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  bank_category TEXT,
  budget_category TEXT,
  method TEXT,
  balance REAL NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'daily_log',
  PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

-- Debts
CREATE TABLE IF NOT EXISTS debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  details TEXT,
  balance REAL NOT NULL,
  monthly_payment REAL NOT NULL DEFAULT 0,
  extra_payment REAL NOT NULL DEFAULT 0,
  projected_payoff TEXT,
  priority TEXT
);
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);

-- Savings Goals
CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target REAL NOT NULL,
  current REAL NOT NULL DEFAULT 0,
  monthly_contribution REAL NOT NULL DEFAULT 0,
  target_date TEXT,
  phase TEXT
);
CREATE INDEX IF NOT EXISTS idx_savings_user ON savings_goals(user_id);

-- Per-user Settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- Sync Metadata
CREATE TABLE IF NOT EXISTS sync_metadata (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  synced_at TEXT,
  PRIMARY KEY (user_id, sync_type)
);
`;

export function getDb(): Database.Database {
  if (!_db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');

    // Init schema if tables don't exist
    const tableCheck = _db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableCheck) {
      _db.exec(SCHEMA_SQL);
    }

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
  }
  return _db;
}
