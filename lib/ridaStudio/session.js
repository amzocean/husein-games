// PIN-based session auth for Fatema's Rida Studio.
// Sessions are opaque random tokens kept in an in-memory Map (never
// persisted to disk) — they simply reset if the server restarts, which is
// an acceptable tradeoff for Render's free tier. RIDA_STUDIO_PIN and the
// resulting session tokens are never logged, returned in a response body,
// or written to disk anywhere in this module.
'use strict';

const crypto = require('crypto');

const COOKIE_NAME = 'rida_session';
const SESSION_TTL_MS = 10 * 60 * 60 * 1000; // 10 hours — within the 8-12h target.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// token -> { expiresAt }
const sessions = new Map();
let failedAttempts = 0;
let lockedUntil = 0;

function getConfiguredPin() {
  const pin = process.env.RIDA_STUDIO_PIN;
  return typeof pin === 'string' && pin.length > 0 ? pin : null;
}

function isPinConfigured() {
  return getConfiguredPin() !== null;
}

/** Constant-time-ish string compare that tolerates differing lengths safely. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Compare against itself to keep the timing profile similar, then fail.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Attempt to log in with `pin`. Returns { token, expiresAt } on success, or
 * null on an incorrect PIN. Throws if RIDA_STUDIO_PIN isn't configured at
 * all (a server misconfiguration, distinct from a wrong guess).
 */
function login(pin) {
  const expected = getConfiguredPin();
  if (!expected) {
    throw new Error('RIDA_STUDIO_PIN is not configured on the server.');
  }
  const now = Date.now();
  if (lockedUntil > now) {
    const err = new Error('Too many incorrect PIN attempts. Please try again later.');
    err.code = 'PIN_RATE_LIMITED';
    err.retryAfterMs = lockedUntil - now;
    throw err;
  }
  if (lockedUntil !== 0) {
    failedAttempts = 0;
    lockedUntil = 0;
  }
  if (typeof pin !== 'string' || pin.length === 0 || !safeEqual(pin, expected)) {
    failedAttempts += 1;
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = now + LOCKOUT_MS;
      const err = new Error('Too many incorrect PIN attempts. Please try again later.');
      err.code = 'PIN_RATE_LIMITED';
      err.retryAfterMs = LOCKOUT_MS;
      throw err;
    }
    return null;
  }
  failedAttempts = 0;
  lockedUntil = 0;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { expiresAt });
  return { token, expiresAt };
}

/** Returns true if `token` is a currently-valid (non-expired) session. */
function isValid(token) {
  if (typeof token !== 'string' || !token) return false;
  const entry = sessions.get(token);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function logout(token) {
  if (typeof token === 'string') sessions.delete(token);
}

/** Test-only: fully reset in-memory session state. */
function _resetForTests() {
  sessions.clear();
  failedAttempts = 0;
  lockedUntil = 0;
}

module.exports = {
  COOKIE_NAME,
  SESSION_TTL_MS,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_MS,
  isPinConfigured,
  login,
  isValid,
  logout,
  _resetForTests,
};
