// Daily rate limiting + concurrency guard for Fatema's Rida Studio
// generation route. The router uses one stable key for the PIN-protected
// user, so logging out and back in cannot reset the allowance. Enforced
// BEFORE calling OpenAI. Only successful
// generations consume allowance — validation failures and OpenAI API
// failures do not count against the daily limit. Concurrency is guarded by
// setting `generating = true` synchronously (Node is single-threaded, so
// there is no race between the check and the set within one event-loop turn).
'use strict';

const DAILY_LIMIT = 10;

// token -> { day: 'YYYY-MM-DD', used: number, generating: boolean }
const state = new Map();

function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getState(token) {
  const today = utcDay();
  let entry = state.get(token);
  if (!entry || entry.day !== today) {
    entry = { day: today, used: 0, generating: false };
    state.set(token, entry);
  }
  return entry;
}

/** Remaining allowance for `token` today (UTC), without mutating anything. */
function remaining(token) {
  return Math.max(0, DAILY_LIMIT - getState(token).used);
}

/**
 * Attempt to begin a generation for `token`. Returns { ok: true } and marks
 * the session as "generating" (synchronously, before any await) if allowed;
 * otherwise returns { ok: false, reason } where reason is
 * 'in_progress' or 'limit_reached'.
 */
function beginGeneration(token) {
  const entry = getState(token);
  if (entry.generating) {
    return { ok: false, reason: 'in_progress' };
  }
  if (entry.used >= DAILY_LIMIT) {
    return { ok: false, reason: 'limit_reached' };
  }
  entry.generating = true;
  return { ok: true };
}

/**
 * End a generation attempt for `token`. Only increments the used count when
 * `success` is true — validation/API failures never consume allowance.
 */
function endGeneration(token, { success }) {
  const entry = getState(token);
  entry.generating = false;
  if (success) entry.used += 1;
}

/** Test-only: fully reset in-memory rate-limit state. */
function _resetForTests() {
  state.clear();
}

module.exports = {
  DAILY_LIMIT,
  utcDay,
  remaining,
  beginGeneration,
  endGeneration,
  _resetForTests,
};
