import { NextResponse } from 'next/server';
import { getDb } from '@/lib/sqlite';

/**
 * GET /api/auth/reset
 *
 * Deletes all non-system users and sessions, then creates a fresh invite token.
 * This is a nuclear option — use only when locked out.
 *
 * Protected by a secret query param to prevent abuse:
 *   /api/auth/reset?secret=triptych-reset-2026
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'triptych-reset-2026') {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
  }

  const db = getDb();

  // Delete all sessions
  db.prepare('DELETE FROM sessions').run();

  // Delete all non-system users
  db.prepare("DELETE FROM users WHERE name != 'system'").run();

  // Delete all used invite tokens
  db.prepare('DELETE FROM invite_tokens WHERE used_by IS NOT NULL').run();

  // Create system user if needed
  const existing = db.prepare("SELECT id FROM users WHERE name = 'system'").get() as { id: number } | undefined;
  let systemId: number;
  if (!existing) {
    const result = db.prepare(
      "INSERT INTO users (name, display_name, pin_hash, role) VALUES ('system', 'System', 'nologin', 'admin')"
    ).run();
    systemId = result.lastInsertRowid as number;
  } else {
    systemId = existing.id;
  }

  // Create fresh invite token
  const crypto = await import('crypto');
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO invite_tokens (token, created_by, expires_at) VALUES (?, ?, ?)').run(token, systemId, expiresAt);

  return NextResponse.json({
    message: 'All users and sessions cleared. Use the link below to register.',
    register_url: `/register?token=${token}`,
    token,
    expires: expiresAt,
  });
}
