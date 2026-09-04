// Local-only storage for the Rida Studio identity pack — the 10 reference
// photos the owner chooses to use as OpenAI identity references in
// production. Written atomically to .birthday-studio/rida-identity.json
// (gitignored, never committed). This module never touches the network and
// never exposes anything beyond the exact filenames the owner selected.
'use strict';

const fs = require('fs');
const path = require('path');
const { RIDA_IDENTITY_PATH, resolveAllowedPhoto } = require('./paths');

const MIN_PHOTOS = 10;
const MAX_PHOTOS = 10;

/** Atomic-ish write: write to a temp file then rename over the target. */
function writeJsonAtomic(targetPath, data) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, targetPath);
}

/** Read the saved identity pack, or null if none has been configured yet. */
function readIdentityPack() {
  if (!fs.existsSync(RIDA_IDENTITY_PATH)) return null;
  const raw = fs.readFileSync(RIDA_IDENTITY_PATH, 'utf8');
  if (!raw.trim()) return null;
  const parsed = JSON.parse(raw);
  const photos = Array.isArray(parsed.photos) ? parsed.photos.filter((n) => typeof n === 'string') : [];
  return { photos, savedAt: parsed.savedAt || null };
}

/**
 * Validate and save exactly 10 photo filenames (all must be in the tiles
 * manifest and pass the same allowlist used everywhere else). Throws a
 * descriptive Error on any violation.
 */
function saveIdentityPack(photos, manifestNames) {
  if (!Array.isArray(photos) || photos.length < MIN_PHOTOS || photos.length > MAX_PHOTOS) {
    throw new Error(`Select exactly ${MIN_PHOTOS} reference photos (got ${Array.isArray(photos) ? photos.length : 0}).`);
  }
  const uniquePhotos = [...new Set(photos)];
  if (uniquePhotos.length !== photos.length) {
    throw new Error('Duplicate photo selected — choose distinct photos.');
  }
  // Re-validate every filename against the manifest + safe-name allowlist —
  // this also rejects path traversal or unlisted filenames.
  for (const name of photos) {
    resolveAllowedPhoto(name, manifestNames);
  }
  const record = { photos, savedAt: new Date().toISOString() };
  writeJsonAtomic(RIDA_IDENTITY_PATH, record);
  return record;
}

/** Build the copyable Render env-var value, e.g. "photo-01.jpg,photo-14.jpg". */
function toRenderValue(photos) {
  return photos.join(',');
}

module.exports = {
  MIN_PHOTOS,
  MAX_PHOTOS,
  readIdentityPack,
  saveIdentityPack,
  toRenderValue,
};
