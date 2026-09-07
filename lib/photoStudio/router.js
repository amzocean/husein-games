'use strict';

const express = require('express');
const fs = require('fs');

const session = require('../ridaStudio/session');
const rateLimit = require('../ridaStudio/rateLimit');
const identity = require('../ridaStudio/identity');
const tilesPhotos = require('../shared/tilesPhotos');
const openaiImagesClient = require('../shared/openaiImagesClient');
const promptBuilder = require('./promptBuilder');

const GENERATE_COUNT = 2;
const IMAGE_SIZE = '1024x1536';
const RELEASE_DATE_UTC = '2026-09-06';
const RATE_LIMIT_KEY = 'rida-studio-pin-user';
const COOKIE_NAME = 'photo_session';
const ALLOWED_FIELDS = ['request'];

function noStore(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
}

function jsonError(res, status, error) {
  res.status(status).json({ error });
}

function isStudioReleased(now = new Date()) {
  return now.toISOString().slice(0, 10) >= RELEASE_DATE_UTC;
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie;
  if (!header) return out;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function isRequestSecure(req) {
  if (req.secure) return true;
  return String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

function setSessionCookie(req, res, token, expiresAt) {
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const attrs = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/photo-studio',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isRequestSecure(req)) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearSessionCookie(req, res) {
  const attrs = [
    `${COOKIE_NAME}=`,
    'Path=/photo-studio',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (isRequestSecure(req)) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function getSessionToken(req) {
  return parseCookies(req)[COOKIE_NAME] || null;
}

function requireAuth(req, res, next) {
  const token = getSessionToken(req);
  if (!session.isValid(token)) {
    return jsonError(res, 401, 'Not authenticated. Please log in with the studio PIN.');
  }
  next();
}

function requireJsonBody(req, res, next) {
  if (!req.is('application/json')) {
    return jsonError(res, 415, 'Request body must be application/json.');
  }
  next();
}

function createRouter({
  now = () => new Date(),
  generateImageEdits = openaiImagesClient.generateImageEdits,
} = {}) {
  const router = express.Router();
  router.use(express.json({ limit: '1mb' }));
  router.use(noStore);
  router.use((req, res, next) => {
    if (!isStudioReleased(now())) {
      return jsonError(res, 403, 'Fatema’s Photo Studio opens on September 6.');
    }
    next();
  });

  router.post('/login', requireJsonBody, (req, res) => {
    if (!session.isPinConfigured()) {
      return jsonError(res, 503, 'The studio PIN is not configured on the server yet.');
    }
    let result;
    try {
      result = session.login(req.body && req.body.pin);
    } catch (err) {
      if (err.code === 'PIN_RATE_LIMITED') {
        const retryAfterSeconds = Math.max(1, Math.ceil(err.retryAfterMs / 1000));
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return jsonError(res, 429, 'Too many incorrect PIN attempts. Please try again later.');
      }
      return jsonError(res, 503, 'The studio PIN is not configured on the server yet.');
    }
    if (!result) return jsonError(res, 401, 'Incorrect PIN.');
    setSessionCookie(req, res, result.token, result.expiresAt);
    res.json({ ok: true });
  });

  router.post('/logout', (req, res) => {
    const token = getSessionToken(req);
    if (token) session.logout(token);
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  router.get('/session', (req, res) => {
    const authenticated = session.isValid(getSessionToken(req));
    res.json({
      authenticated,
    });
  });

  router.post('/generate', requireAuth, requireJsonBody, async (req, res) => {
    const body = req.body || {};
    const extraKeys = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key));
    if (extraKeys.length) {
      return jsonError(res, 400, `Unexpected field(s) in request: ${extraKeys.join(', ')}`);
    }

    let request;
    try {
      request = promptBuilder.normalizeRequest(body.request);
    } catch (err) {
      return jsonError(res, 400, err.message);
    }

    const gate = rateLimit.beginGeneration(RATE_LIMIT_KEY);
    if (!gate.ok) {
      return jsonError(res, 409, 'A studio generation is already in progress. Please wait for it to finish.');
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
        return jsonError(res, 500, 'Identity reference photos are not configured correctly on the server.');
      }

      let referenceBuffers;
      try {
        referenceBuffers = identityResult.resolved.map((photo) => ({
          buffer: fs.readFileSync(photo.path),
          filename: photo.name,
          mimeType: tilesPhotos.extForPhoto(photo.name),
        }));
      } catch (err) {
        return jsonError(res, 500, 'Could not read identity reference photo(s).');
      }

      const prompt = promptBuilder.buildPrompt(request, {
        identityReferenceCount: identityResult.resolved.length,
      });
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return jsonError(res, 503, 'Image generation is not configured on the server yet. Please try again later.');
      }

      let result;
      try {
        result = await generateImageEdits({
          apiKey,
          model: process.env.OPENAI_IMAGE_MODEL || openaiImagesClient.DEFAULT_MODEL,
          referenceBuffers,
          prompt,
          n: GENERATE_COUNT,
          size: IMAGE_SIZE,
          outputFormat: 'png',
        });
      } catch (err) {
        if (err.code === 'OPENAI_TIMEOUT') return jsonError(res, 504, err.message);
        return jsonError(res, 502, `Image generation failed: ${err.message}`);
      }

      if (!Array.isArray(result.images) || result.images.length !== GENERATE_COUNT) {
        return jsonError(res, 502, 'Image generation returned an unexpected number of results.');
      }

      success = true;
      rateLimit.endGeneration(RATE_LIMIT_KEY);
      res.json({
        images: result.images.map((image) => image.b64Json),
        model: result.model,
      });
    } finally {
      if (!success) rateLimit.endGeneration(RATE_LIMIT_KEY);
    }
  });

  router.use((req, res) => {
    jsonError(res, 404, `Not found: ${req.method} ${req.path}`);
  });

  router.use((err, req, res, next) => {
    if (err && err.type === 'entity.too.large') {
      return jsonError(res, 413, 'The request is too large.');
    }
    jsonError(res, 500, `Unexpected server error: ${err.message}`);
  });

  return router;
}

module.exports = {
  createRouter,
  isStudioReleased,
  RELEASE_DATE_UTC,
  GENERATE_COUNT,
  IMAGE_SIZE,
  RATE_LIMIT_KEY,
  COOKIE_NAME,
  ALLOWED_FIELDS,
  parseCookies,
  getSessionToken,
};
