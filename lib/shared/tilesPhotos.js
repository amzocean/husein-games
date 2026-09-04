// Shared tiles-photo allowlist helpers.
// Extracted from tools/birthday-studio/paths.js so both the owner-only local
// tool and the permanent production Rida Studio game can validate reference
// photo filenames against public/tiles/photos/manifest.json the same way,
// without the production server depending on the local-only tool's code.
'use strict';

const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.join(__dirname, '..', '..');
const TILES_PHOTOS_DIR = path.join(REPO_ROOT, 'public', 'tiles', 'photos');
const TILES_MANIFEST_PATH = path.join(TILES_PHOTOS_DIR, 'manifest.json');

// Only plain "photo-<digits>.jpg" style names are ever accepted — this
// matches the existing tiles manifest.json contents exactly.
const SAFE_PHOTO_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}\.(jpg|jpeg|png|webp)$/i;

function readTilesManifest() {
  const raw = fs.readFileSync(TILES_MANIFEST_PATH, 'utf8');
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error('tiles manifest.json is not an array');
  return list.filter((n) => typeof n === 'string');
}

/**
 * Resolve `name` as a photo file inside public/tiles/photos, verifying it is
 * both a syntactically safe name AND listed in the tiles manifest.json, AND
 * that the resolved absolute path stays inside TILES_PHOTOS_DIR.
 * Throws on any violation — callers should catch and return an explicit error.
 */
function resolveAllowedPhoto(name, manifestNames) {
  if (typeof name !== 'string' || !SAFE_PHOTO_NAME.test(name)) {
    throw new Error(`Invalid photo filename: ${JSON.stringify(name)}`);
  }
  if (!manifestNames.includes(name)) {
    throw new Error(`Photo not found in manifest: ${name}`);
  }
  const resolved = path.resolve(TILES_PHOTOS_DIR, name);
  if (path.dirname(resolved) !== TILES_PHOTOS_DIR) {
    throw new Error(`Photo path escapes allowed directory: ${name}`);
  }
  return resolved;
}

function extForPhoto(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

module.exports = {
  REPO_ROOT,
  TILES_PHOTOS_DIR,
  TILES_MANIFEST_PATH,
  SAFE_PHOTO_NAME,
  readTilesManifest,
  resolveAllowedPhoto,
  extForPhoto,
};
