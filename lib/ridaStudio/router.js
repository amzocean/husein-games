// Express router for Fatema's Rida Studio — the permanent, PIN-protected
// production game. Mounted by the root server.js at /rida-studio/api. This
// module must never depend on tools/birthday-studio (the owner-only local
// tool) — only on the shared lib/ modules also used by that tool.
'use strict';

const express = require('express');
const fs = require('fs');

const session = require('./session');
const rateLimit = require('./rateLimit');
const options = require('./options');
const promptBuilder = require('./promptBuilder');
const identity = require('./identity');
const tilesPhotos = require('../shared/tilesPhotos');
const openaiImagesClient = require('../shared/openaiImagesClient');

const GENERATE_COUNT = 2; // "generate exactly 2 live AI images" per request.
const IMAGE_SIZE = '1024x1536'; // Portrait, suited to a full-body rida look.
const SELECTION_FIELDS = [
  'color', 'motif', 'border', 'panel', 'style', 'location',
  'baseDescription', 'designDescription', 'embroideryDescription',
  'baseClothPhoto', 'designPhoto',
];
const RATE_LIMIT_KEY = 'rida-studio-pin-user';
const MAX_FABRIC_BYTES = 5 * 1024 * 1024;
const FABRIC_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function noStore(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
}

function jsonError(res, status, error) {
  res.status(status).json({ error });
}

/** Minimal cookie parser — avoids adding a cookie-parser dependency. */
function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function isRequestSecure(req) {
  if (req.secure) return true;
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return proto === 'https';
}

function setSessionCookie(req, res, token, expiresAt) {
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const attrs = [
    `${session.COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/rida-studio',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isRequestSecure(req)) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearSessionCookie(req, res) {
  const attrs = [
    `${session.COOKIE_NAME}=`,
    'Path=/rida-studio',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (isRequestSecure(req)) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function getSessionToken(req) {
  return parseCookies(req)[session.COOKIE_NAME] || null;
}

function requireAuth(req, res, next) {
  const token = getSessionToken(req);
  if (!session.isValid(token)) {
    return jsonError(res, 401, 'Not authenticated. Please log in with the studio PIN.');
  }
  req.ridaSessionToken = token;
  next();
}

function requireJsonBody(req, res, next) {
  if (!req.is('application/json')) {
    return jsonError(res, 415, 'Request body must be application/json.');
  }
  next();
}

function parseReferencePhoto(value, label) {
  if (value === undefined || value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an image object.`);
  }
  const extraKeys = Object.keys(value).filter((key) => !['mimeType', 'base64'].includes(key));
  if (extraKeys.length) {
    throw new Error(`${label} contains unexpected fields.`);
  }
  if (!FABRIC_MIME_TYPES.has(value.mimeType)) {
    throw new Error(`${label} must be JPEG, PNG, or WebP.`);
  }
  if (typeof value.base64 !== 'string' || !value.base64 || value.base64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(value.base64)) {
    throw new Error(`${label} data is invalid.`);
  }
  const buffer = Buffer.from(value.base64, 'base64');
  if (buffer.length < 32 || buffer.length > MAX_FABRIC_BYTES) {
    throw new Error(`${label} must be between 32 bytes and ${MAX_FABRIC_BYTES / (1024 * 1024)} MB.`);
  }

  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if ((value.mimeType === 'image/jpeg' && !isJpeg) ||
      (value.mimeType === 'image/png' && !isPng) ||
      (value.mimeType === 'image/webp' && !isWebp)) {
    throw new Error(`${label} contents do not match its image type.`);
  }

  const extension = value.mimeType === 'image/png' ? 'png' : value.mimeType === 'image/webp' ? 'webp' : 'jpg';
  return {
    buffer,
    filename: `uploaded-${label.toLowerCase().replace(/[^a-z]+/g, '-')}.${extension}`,
    mimeType: value.mimeType,
  };
}

function createRouter() {
  const router = express.Router();
  router.use(express.json({ limit: '16mb' }));
  router.use(noStore);

  router.post('/login', requireJsonBody, (req, res) => {
    const pin = req.body && req.body.pin;
    if (!session.isPinConfigured()) {
      return jsonError(res, 503, 'The studio PIN is not configured on the server yet.');
    }
    let result;
    try {
      result = session.login(pin);
    } catch (err) {
      if (err.code === 'PIN_RATE_LIMITED') {
        const retryAfterSeconds = Math.max(1, Math.ceil(err.retryAfterMs / 1000));
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return jsonError(res, 429, 'Too many incorrect PIN attempts. Please try again later.');
      }
      return jsonError(res, 503, 'The studio PIN is not configured on the server yet.');
    }
    if (!result) {
      return jsonError(res, 401, 'Incorrect PIN.');
    }
    setSessionCookie(req, res, result.token, result.expiresAt);
    res.json({ ok: true, remaining: rateLimit.remaining(RATE_LIMIT_KEY), dailyLimit: rateLimit.DAILY_LIMIT });
  });

  router.post('/logout', (req, res) => {
    const token = getSessionToken(req);
    if (token) session.logout(token);
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  router.get('/session', (req, res) => {
    const token = getSessionToken(req);
    const authenticated = session.isValid(token);
    res.json({
      authenticated,
      remaining: authenticated ? rateLimit.remaining(RATE_LIMIT_KEY) : null,
      dailyLimit: rateLimit.DAILY_LIMIT,
    });
  });

  router.get('/options', requireAuth, (req, res) => {
    res.json({
      options: options.listOptions(),
      remaining: rateLimit.remaining(RATE_LIMIT_KEY),
      dailyLimit: rateLimit.DAILY_LIMIT,
    });
  });

  router.post('/generate', requireAuth, requireJsonBody, async (req, res) => {
    const body = req.body || {};

    // Exact allowlisted fields only — no unrestricted prompt text, no extras.
    const extraKeys = Object.keys(body).filter((k) => !SELECTION_FIELDS.includes(k));
    if (extraKeys.length) {
      return jsonError(res, 400, `Unexpected field(s) in request: ${extraKeys.join(', ')}`);
    }
    const selectionErrors = options.validateSelections(body);
    if (selectionErrors.length) {
      return jsonError(res, 400, `Invalid selections: ${selectionErrors.join('; ')}`);
    }
    try {
      promptBuilder.normalizeDescription(body.baseDescription, 'Base-cloth description');
      promptBuilder.normalizeDescription(body.designDescription, 'Design description');
      promptBuilder.normalizeDescription(body.embroideryDescription, 'Embroidery description');
    } catch (err) {
      return jsonError(res, 400, err.message);
    }

    let baseClothReference;
    let designReference;
    try {
      baseClothReference = parseReferencePhoto(body.baseClothPhoto, 'Base cloth photo');
      designReference = parseReferencePhoto(body.designPhoto, 'Design example photo');
    } catch (err) {
      return jsonError(res, 400, err.message);
    }

    const gate = rateLimit.beginGeneration(RATE_LIMIT_KEY);
    if (!gate.ok) {
      if (gate.reason === 'in_progress') {
        return jsonError(res, 409, 'A generation is already in progress for this session. Please wait for it to finish.');
      }
      return jsonError(res, 429, `Daily generation limit reached (${rateLimit.DAILY_LIMIT} per UTC day). Please try again tomorrow.`);
    }

    let success = false;
    try {
      let manifestNames;
      try {
        manifestNames = tilesPhotos.readTilesManifest();
      } catch (err) {
        return jsonError(res, 500, 'Could not read the photo manifest.');
      }

      let identityResult;
      try {
        identityResult = identity.resolveIdentityPhotos(manifestNames);
      } catch (err) {
        // Never leak filenames or path details to the browser.
        return jsonError(res, 500, 'Identity reference photos are not configured correctly on the server.');
      }

      let referenceBuffers;
      try {
        referenceBuffers = identityResult.resolved.map((p) => ({
          buffer: fs.readFileSync(p.path),
          filename: p.name,
          mimeType: tilesPhotos.extForPhoto(p.name),
        }));
      } catch (err) {
        return jsonError(res, 500, 'Could not read identity reference photo(s).');
      }
      if (baseClothReference) referenceBuffers.push(baseClothReference);
      if (designReference) referenceBuffers.push(designReference);

      let prompt;
      try {
        prompt = promptBuilder.buildPrompt(body, {
          identityReferenceCount: identityResult.resolved.length,
          hasBaseClothReference: Boolean(baseClothReference),
          hasDesignReference: Boolean(designReference),
        });
      } catch (err) {
        return jsonError(res, 400, err.message);
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return jsonError(res, 503, 'Image generation is not configured on the server yet. Please try again later.');
      }

      let result;
      try {
        result = await openaiImagesClient.generateImageEdits({
          apiKey,
          model: process.env.OPENAI_IMAGE_MODEL || openaiImagesClient.DEFAULT_MODEL,
          referenceBuffers,
          prompt,
          n: GENERATE_COUNT,
          size: IMAGE_SIZE,
          outputFormat: 'png',
        });
      } catch (err) {
        if (err.code === 'OPENAI_TIMEOUT') {
          return jsonError(res, 504, err.message);
        }
        return jsonError(res, 502, `Image generation failed: ${err.message}`);
      }

      if (!Array.isArray(result.images) || result.images.length !== GENERATE_COUNT) {
        return jsonError(res, 502, 'Image generation returned an unexpected number of results.');
      }

      success = true;
      rateLimit.endGeneration(RATE_LIMIT_KEY, { success });
      res.json({
        images: result.images.map((img) => img.b64Json),
        model: result.model,
        remaining: rateLimit.remaining(RATE_LIMIT_KEY),
      });
    } finally {
      // Only reached without having already ended generation when an early
      // `return` above skipped the success path (validation/API failure) —
      // endGeneration is idempotent-safe here since `generating` is simply
      // reset to false and `success` is false, so no allowance is consumed.
      if (!success) rateLimit.endGeneration(RATE_LIMIT_KEY, { success: false });
    }
  });

  // Explicit JSON 404 for anything unmatched under this router.
  router.use((req, res) => {
    jsonError(res, 404, `Not found: ${req.method} ${req.path}`);
  });

  // eslint-disable-next-line no-unused-vars
  router.use((err, req, res, next) => {
    if (err && err.type === 'entity.too.large') {
      return jsonError(res, 413, 'The uploaded reference photo is too large.');
    }
    jsonError(res, 500, `Unexpected server error: ${err.message}`);
  });

  return router;
}

module.exports = {
  createRouter,
  GENERATE_COUNT,
  IMAGE_SIZE,
  SELECTION_FIELDS,
  RATE_LIMIT_KEY,
  MAX_FABRIC_BYTES,
  FABRIC_MIME_TYPES,
  parseReferencePhoto,
  parseCookies,
  getSessionToken,
};
