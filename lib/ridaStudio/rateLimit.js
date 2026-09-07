// Shared concurrency guard for Fatema's AI studio generation routes.
// Setting `generating = true` synchronously prevents duplicate OpenAI calls
// across Rida Studio and Photo Studio within one event-loop turn.
'use strict';

// key -> { generating: boolean }
const state = new Map();

function getState(token) {
  let entry = state.get(token);
  if (!entry) {
    entry = { generating: false };
    state.set(token, entry);
  }
  return entry;
}

/**
 * Attempt to begin a generation for `token`. Returns { ok: true } and marks
 * the session as "generating" (synchronously, before any await) if allowed;
 * otherwise returns { ok: false, reason: 'in_progress' }.
 */
function beginGeneration(token) {
  const entry = getState(token);
  if (entry.generating) {
    return { ok: false, reason: 'in_progress' };
  }
  entry.generating = true;
  return { ok: true };
}

/** Release the shared generation lock after success or failure. */
function endGeneration(token) {
  const entry = getState(token);
  entry.generating = false;
}

/** Test-only: fully reset in-memory concurrency state. */
function _resetForTests() {
  state.clear();
}

module.exports = {
  beginGeneration,
  endGeneration,
  _resetForTests,
};
