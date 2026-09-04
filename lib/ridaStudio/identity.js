// Identity reference-photo resolution for Fatema's Rida Studio.
// Production reads a comma-separated filename list from RIDA_REFERENCE_PHOTOS
// (an env var — never chosen or learned by the public browser). If that env
// var isn't set (local development only), it falls back to reading
// .birthday-studio/rida-identity.json, written by the owner-only setup
// section in tools/birthday-studio. Every filename is re-validated against
// the tiles manifest.json allowlist regardless of source.
'use strict';

const fs = require('fs');
const path = require('path');
const { REPO_ROOT, resolveAllowedPhoto } = require('../shared/tilesPhotos');

const RIDA_IDENTITY_PATH = path.join(REPO_ROOT, '.birthday-studio', 'rida-identity.json');
const MIN_PHOTOS = 10;
const MAX_PHOTOS = 10;

function parseEnvList(value) {
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function readLocalFallback() {
  if (!fs.existsSync(RIDA_IDENTITY_PATH)) return null;
  const raw = fs.readFileSync(RIDA_IDENTITY_PATH, 'utf8');
  if (!raw.trim()) return null;
  const parsed = JSON.parse(raw);
  const photos = Array.isArray(parsed.photos) ? parsed.photos.filter((n) => typeof n === 'string') : [];
  return photos;
}

/**
 * Resolve the configured identity reference photos to safe, allowlisted
 * absolute paths. Throws a descriptive Error if misconfigured — callers
 * should turn that into an explicit (but filename-free) JSON error, since
 * these filenames must never reach the browser.
 */
function resolveIdentityPhotos(manifestNames) {
  const envValue = process.env.RIDA_REFERENCE_PHOTOS;
  let filenames;
  let source;
  if (typeof envValue === 'string' && envValue.trim()) {
    filenames = parseEnvList(envValue);
    source = 'env:RIDA_REFERENCE_PHOTOS';
  } else {
    filenames = readLocalFallback() || [];
    source = '.birthday-studio/rida-identity.json';
  }

  if (filenames.length < MIN_PHOTOS || filenames.length > MAX_PHOTOS) {
    throw new Error(
      `Identity reference photos are not configured correctly (need exactly ${MIN_PHOTOS} filenames, ` +
      `found ${filenames.length} from ${source}).`
    );
  }

  const resolved = filenames.map((name) => ({
    name,
    path: resolveAllowedPhoto(name, manifestNames),
  }));
  return { resolved, source };
}

module.exports = {
  RIDA_IDENTITY_PATH,
  MIN_PHOTOS,
  MAX_PHOTOS,
  parseEnvList,
  readLocalFallback,
  resolveIdentityPhotos,
};
