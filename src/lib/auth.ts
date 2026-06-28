/**
 * Lightweight admin authentication utilities.
 *
 * Uses bcryptjs for password hashing and Node's built-in crypto for
 * HMAC-signed session tokens (no external JWT library needed).
 *
 * The session token is stored in an HTTP-only cookie named "admin_session".
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'

// ─── Configuration ────────────────────────────────────────────────

const SESSION_COOKIE = 'admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (seconds)

// Secret used to sign tokens. Falls back to a dev-only constant so the
// app doesn't crash if the env var is missing — but in production a
// proper NEXTAUTH_SECRET or ADMIN_SECRET should be set.
const SESSION_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.ADMIN_SECRET ||
  'aip-peru-admin-dev-secret-change-in-prod-2026'

// ─── Token helpers (HMAC-SHA256 signed JSON) ─────────────────────

interface SessionPayload {
  uid: string      // AdminUser.id
  username: string // AdminUser.username
  iat: number      // issued-at (epoch seconds)
  exp: number      // expiry   (epoch seconds)
}

function sign(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(body)
    .digest('base64url')
  return `${body}.${sig}`
}

function verify(token: string): SessionPayload | null {
  try {
    const [body, sig] = token.split('.')
    if (!body || !sig) return null
    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(body)
      .digest('base64url')
    // Timing-safe comparison
    if (sig.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// ─── Cookie helpers (server-side, uses next/headers) ─────────────

/**
 * Creates a signed session token and sets it as an HTTP-only cookie.
 * Call this from a Server Action or Route Handler after successful login.
 */
export async function setSessionCookie(uid: string, username: string) {
  const now = Math.floor(Date.now() / 1000)
  const token = sign({
    uid,
    username,
    iat: now,
    exp: now + SESSION_MAX_AGE,
  })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/**
 * Clears the session cookie (logout).
 */
export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

/**
 * Reads and verifies the session cookie. Returns the payload or null.
 * Use this in Route Handlers to gate admin-only endpoints.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verify(token)
}

/**
 * Throws a 401 Response if the caller is not authenticated.
 * Returns the session payload on success.
 *
 * Usage in a Route Handler:
 *   const session = await requireAdmin()
 *   if (session instanceof Response) return session
 */
export async function requireAdmin(): Promise<SessionPayload | Response> {
  const session = await getSession()
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'No autorizado. Inicie sesión como administrador.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return session
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
