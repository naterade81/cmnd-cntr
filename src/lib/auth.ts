import crypto from 'crypto';
import { cookies } from 'next/headers';
import {
  createSession as dbCreateSession,
  getSession as dbGetSession,
  deleteSession as dbDeleteSession,
  deleteExpiredSessions,
  getUserById,
  getUserByName,
  createUser,
  createInviteToken as dbCreateInviteToken,
  getInviteToken as dbGetInviteToken,
  markInviteTokenUsed,
  type UserRow,
} from './db';

const SESSION_COOKIE = 'dashboard_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// --- PIN Hashing ---

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(pin, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'));
}

// --- Sessions ---

export function createSessionToken(userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  deleteExpiredSessions();
  dbCreateSession(token, userId, expiresAt);
  return token;
}

export function validateSession(token: string): { userId: number; user: UserRow } | null {
  const session = dbGetSession(token);
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    dbDeleteSession(token);
    return null;
  }
  const user = getUserById(session.user_id);
  if (!user) {
    dbDeleteSession(token);
    return null;
  }
  return { userId: user.id, user };
}

export function destroySession(token: string) {
  dbDeleteSession(token);
}

// --- Auth from cookies (for server components) ---

export async function getAuthFromCookies(): Promise<{ userId: number; user: UserRow } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return validateSession(token);
}

// --- Auth from request (for API routes) ---

export function getAuthFromRequest(request: Request): { userId: number; user: UserRow } | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  return validateSession(match[1]);
}

export function requireAuth(request: Request): { userId: number; user: UserRow } {
  const auth = getAuthFromRequest(request);
  if (!auth) throw new AuthError('Not authenticated');
  return auth;
}

export function requireAdmin(request: Request): { userId: number; user: UserRow } {
  const auth = requireAuth(request);
  if (auth.user.role !== 'admin') throw new AuthError('Admin access required');
  return auth;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// --- Login ---

export function login(name: string, pin: string): { token: string; user: UserRow } | null {
  const user = getUserByName(name.toLowerCase());
  if (!user) return null;
  if (!verifyPin(pin, user.pin_hash)) return null;
  const token = createSessionToken(user.id);
  return { token, user };
}

// --- Registration (via invite) ---

export function registerWithInvite(inviteToken: string, name: string, displayName: string, pin: string, avatarColor?: string): { token: string; user: UserRow } | null {
  const invite = dbGetInviteToken(inviteToken);
  if (!invite) return null;

  const user = createUser({
    name: name.toLowerCase(),
    display_name: displayName,
    pin_hash: hashPin(pin),
    role: 'member',
    avatar_color: avatarColor || '#00e5ff',
  });

  markInviteTokenUsed(inviteToken, user.id);
  const sessionToken = createSessionToken(user.id);
  return { token: sessionToken, user };
}

// --- Invite Tokens ---

export function generateInviteToken(adminUserId: number): string {
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  dbCreateInviteToken(token, adminUserId, expiresAt);
  return token;
}

// Cookie helpers
export const SESSION_COOKIE_NAME = SESSION_COOKIE;
