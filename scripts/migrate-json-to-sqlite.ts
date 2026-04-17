/**
 * Migration script: JSON (dashboard.json) → SQLite (dashboard.db)
 * Creates a Nathan admin user and imports all existing data under user_id=1.
 *
 * Usage: npx tsx scripts/migrate-json-to-sqlite.ts
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_PATH = path.join(DATA_DIR, 'dashboard.json');
const DB_PATH = path.join(DATA_DIR, 'dashboard.db');

// Simple PIN hash (matches what auth.ts will use)
function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function migrate() {
  if (!fs.existsSync(JSON_PATH)) {
    console.error('No dashboard.json found at', JSON_PATH);
    process.exit(1);
  }

  if (fs.existsSync(DB_PATH)) {
    console.log('dashboard.db already exists. Removing for fresh migration...');
    fs.unlinkSync(DB_PATH);
    // Also remove WAL/SHM files if present
    if (fs.existsSync(DB_PATH + '-wal')) fs.unlinkSync(DB_PATH + '-wal');
    if (fs.existsSync(DB_PATH + '-shm')) fs.unlinkSync(DB_PATH + '-shm');
  }

  console.log('Reading dashboard.json...');
  const json = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

  console.log('Creating SQLite database...');
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Load and run schema
  const { getDb } = require('../src/lib/sqlite');
  // We'll run schema inline instead
  const SCHEMA_SQL = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'sqlite.ts'), 'utf-8');
  // Extract SQL from the template literal
  const match = SCHEMA_SQL.match(/const SCHEMA_SQL = `([\s\S]*?)`;/);
  if (!match) {
    console.error('Could not extract schema SQL from sqlite.ts');
    process.exit(1);
  }
  db.exec(match[1]);

  const USER_ID = 1;
  const DEFAULT_PIN = '1234'; // Nathan can change this later

  // Create admin user
  console.log('Creating admin user (Nathan)...');
  db.prepare(
    'INSERT INTO users (id, name, display_name, pin_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(USER_ID, 'nathan', 'Nathan', hashPin(DEFAULT_PIN), 'admin', '#AF00F1');

  // Migrate tasks
  const tasks = json.tasks || [];
  console.log(`Migrating ${tasks.length} tasks...`);
  const insertTask = db.prepare(
    `INSERT INTO tasks (id, user_id, title, description, category, status, priority, project, scheduled_date, due_date, completed_at, clickup_id, clickup_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const t of tasks) {
    insertTask.run(
      t.id, USER_ID, t.title, t.description, t.category, t.status, t.priority,
      t.project, t.scheduled_date, t.due_date, t.completed_at,
      t.clickup_id, t.clickup_url, t.created_at, t.updated_at
    );
  }

  // Migrate effort logs
  const efforts = json.effort_logs || [];
  console.log(`Migrating ${efforts.length} effort logs...`);
  const insertEffort = db.prepare(
    'INSERT INTO effort_logs (id, user_id, category, project, hours, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const e of efforts) {
    insertEffort.run(e.id, USER_ID, e.category, e.project, e.hours, e.description, e.date, e.created_at);
  }

  // Migrate goals
  const goals = json.goals || [];
  console.log(`Migrating ${goals.length} goals...`);
  const insertGoal = db.prepare(
    'INSERT INTO goals (id, user_id, title, category, target_value, current_value, unit, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const g of goals) {
    insertGoal.run(g.id, USER_ID, g.title, g.category, g.target_value, g.current_value, g.unit, g.start_date, g.end_date, g.created_at, g.updated_at);
  }

  // Migrate calendar events
  const events = json.calendar_events || [];
  console.log(`Migrating ${events.length} calendar events...`);
  const insertEvent = db.prepare(
    'INSERT INTO calendar_events (id, user_id, summary, start, end, all_day, location, description, calendar, color, html_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const e of events) {
    insertEvent.run(e.id, USER_ID, e.summary, e.start, e.end, e.allDay ? 1 : 0, e.location, e.description, e.calendar, e.color, e.htmlLink);
  }

  // Migrate budget categories
  const budgetCats = json.budget_categories || [];
  console.log(`Migrating ${budgetCats.length} budget categories...`);
  const insertBudgetCat = db.prepare(
    'INSERT INTO budget_categories (user_id, section, category, subcategory, budgeted, frequency, due_date, auto_pay, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const c of budgetCats) {
    insertBudgetCat.run(USER_ID, c.section, c.category, c.subcategory, c.budgeted, c.frequency, c.dueDate, c.autoPay ? 1 : 0, c.notes);
  }

  // Migrate transactions
  const txns = json.transactions || [];
  console.log(`Migrating ${txns.length} transactions...`);
  const insertTxn = db.prepare(
    'INSERT INTO transactions (id, user_id, date, description, amount, type, bank_category, budget_category, method, balance, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const t of txns) {
    insertTxn.run(t.id, USER_ID, t.date, t.description, t.amount, t.type, t.bankCategory, t.budgetCategory, t.method, t.balance, t.source);
  }

  // Migrate debts
  const debts = json.debts || [];
  console.log(`Migrating ${debts.length} debts...`);
  const insertDebt = db.prepare(
    'INSERT INTO debts (user_id, name, details, balance, monthly_payment, extra_payment, projected_payoff, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const d of debts) {
    insertDebt.run(USER_ID, d.name, d.details, d.balance, d.monthlyPayment, d.extraPayment, d.projectedPayoff, d.priority);
  }

  // Migrate savings goals
  const savings = json.savings_goals || [];
  console.log(`Migrating ${savings.length} savings goals...`);
  const insertSaving = db.prepare(
    'INSERT INTO savings_goals (user_id, name, description, target, current, monthly_contribution, target_date, phase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const s of savings) {
    insertSaving.run(USER_ID, s.name, s.description, s.target, s.current, s.monthlyContribution, s.targetDate, s.phase);
  }

  // Migrate settings
  const settings = json.settings || {};
  const settingEntries = Object.entries(settings);
  console.log(`Migrating ${settingEntries.length} settings...`);
  const insertSetting = db.prepare(
    'INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)'
  );
  for (const [key, value] of settingEntries) {
    insertSetting.run(USER_ID, key, value as string);
  }

  // Migrate sync timestamps
  if (json.calendar_synced_at) {
    db.prepare('INSERT INTO sync_metadata (user_id, sync_type, synced_at) VALUES (?, ?, ?)').run(USER_ID, 'calendar', json.calendar_synced_at);
  }
  if (json.budget_synced_at) {
    db.prepare('INSERT INTO sync_metadata (user_id, sync_type, synced_at) VALUES (?, ?, ?)').run(USER_ID, 'budget', json.budget_synced_at);
  }

  // Backup JSON file
  const backupPath = JSON_PATH + '.backup';
  fs.renameSync(JSON_PATH, backupPath);
  console.log(`\nBackup saved to ${backupPath}`);

  // Summary
  const counts = {
    tasks: db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number },
    efforts: db.prepare('SELECT COUNT(*) as c FROM effort_logs').get() as { c: number },
    goals: db.prepare('SELECT COUNT(*) as c FROM goals').get() as { c: number },
    events: db.prepare('SELECT COUNT(*) as c FROM calendar_events').get() as { c: number },
    budgetCats: db.prepare('SELECT COUNT(*) as c FROM budget_categories').get() as { c: number },
    transactions: db.prepare('SELECT COUNT(*) as c FROM transactions').get() as { c: number },
    debts: db.prepare('SELECT COUNT(*) as c FROM debts').get() as { c: number },
    savings: db.prepare('SELECT COUNT(*) as c FROM savings_goals').get() as { c: number },
  };

  console.log('\nMigration complete!');
  console.log('---');
  console.log(`Tasks: ${counts.tasks.c}`);
  console.log(`Effort Logs: ${counts.efforts.c}`);
  console.log(`Goals: ${counts.goals.c}`);
  console.log(`Calendar Events: ${counts.events.c}`);
  console.log(`Budget Categories: ${counts.budgetCats.c}`);
  console.log(`Transactions: ${counts.transactions.c}`);
  console.log(`Debts: ${counts.debts.c}`);
  console.log(`Savings Goals: ${counts.savings.c}`);
  console.log('---');
  console.log(`Admin user: nathan (PIN: ${DEFAULT_PIN}) — change this after first login!`);

  db.close();
}

migrate();
