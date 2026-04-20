import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/sqlite';

/**
 * GET /api/auth/bootstrap
 *
 * Creates a first-user invite token if no users exist (or only the system user).
 * Returns 403 if real users already exist — UNLESS ?reset=triptych-reset-2026
 * is passed, which wipes all users and sessions first.
 */
export async function GET(request: NextRequest) {
  const db = getDb();
  const resetSecret = request.nextUrl.searchParams.get('reset');

  // If reset secret provided, wipe all users and sessions
  if (resetSecret === 'triptych-reset-2026') {
    db.prepare('DELETE FROM sessions').run();
    db.prepare("DELETE FROM users WHERE name != 'system'").run();
    db.prepare('DELETE FROM invite_tokens WHERE used_by IS NOT NULL').run();
  }

  // Check if real users exist (exclude system user)
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE name != 'system'").get() as { count: number };

  if (userCount.count > 0) {
    return NextResponse.json({ error: 'Users already exist. Bootstrap disabled.' }, { status: 403 });
  }

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

  // Create invite token (7 day expiry)
  const crypto = await import('crypto');
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO invite_tokens (token, created_by, expires_at) VALUES (?, ?, ?)').run(token, systemId, expiresAt);

  return NextResponse.json({
    message: 'Invite token created. Use the register_url to create your account.',
    register_url: `/register?token=${token}`,
    token,
    expires: expiresAt,
  });
}
