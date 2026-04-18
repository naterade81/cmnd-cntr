import { NextResponse } from 'next/server';
import { getDb } from '@/lib/sqlite';
import { createInviteToken } from '@/lib/auth';

/**
 * GET /api/auth/bootstrap
 *
 * Creates a first-user invite token if no users exist (or only the system user).
 * Returns 403 if real users already exist (prevents abuse).
 */
export async function GET() {
  const db = getDb();

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
    message: 'First-user invite token created',
    register_url: `/register?token=${token}`,
    token,
    expires: expiresAt,
  });
}
