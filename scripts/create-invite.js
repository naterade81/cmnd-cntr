#!/usr/bin/env node
/**
 * Creates a first-user invite token for bootstrapping a fresh database.
 * Usage: node scripts/create-invite.js
 *
 * Outputs the registration URL with the token.
 */
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Ensure tables exist
db.exec(`
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
  CREATE TABLE IF NOT EXISTS invite_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    created_by INTEGER DEFAULT 0,
    used_by INTEGER,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Create a system user if none exist (needed for foreign key on invite tokens)
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
let systemUserId;
if (userCount.count === 0) {
  const result = db.prepare(
    "INSERT INTO users (name, display_name, pin_hash, role) VALUES ('system', 'System', 'nologin', 'admin')"
  ).run();
  systemUserId = result.lastInsertRowid;
  console.log('Created system user (id:', systemUserId, ')');
} else {
  systemUserId = db.prepare('SELECT id FROM users LIMIT 1').get().id;
}

const token = crypto.randomBytes(16).toString('hex');
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

db.prepare('INSERT INTO invite_tokens (token, created_by, expires_at) VALUES (?, ?, ?)').run(token, systemUserId, expiresAt);

console.log('\n=== Invite Token Created ===');
console.log(`Token: ${token}`);
console.log(`Expires: ${expiresAt}`);
console.log(`\nRegister at:`);
console.log(`  Local:  http://localhost:3025/register?token=${token}`);
console.log(`  Prod:   https://dashboard.triptych.co/register?token=${token}`);
console.log('');

db.close();
