// Birthday Image Studio — standalone local-only server.
// Binds ONLY to 127.0.0.1. Never touches 0.0.0.0. Never proxies or logs the
// OpenAI API key. This server is for Husein's pre-generation curation only —
// nothing here is reachable from the live site or from Fatema's browser.
'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const paths = require('./paths');
const promptBuilder = require('./promptBuilder');
const openaiClient = require('./openaiClient');
const store = require('./store');
const identityStore = require('./identityStore');

const DEFAULT_PORT = 4173;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_NOTE_LENGTH = promptBuilder.MAX_NOTE_LENGTH;

function jsonError(res, status, message, details) {
  const body = { error: message };
  if (details !== undefined) body.details = details;
  res.status(status).json(body);
}

function extForPhoto(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

function validateSelectionsBody(body) {
  const errors = [];
  const photos = Array.isArray(body.photos) ? body.photos : [];
  if (photos.length < 1 || photos.length > 4) {
    errors.push('Select between 1 and 4 reference photos.');
  }
  const count = Number(body.count);
  if (!Number.isInteger(count) || count < 1 || count > 4) {
    errors.push('Candidate count must be an integer between 1 and 4.');
  }
  if (!promptBuilder.STYLES[body.style]) errors.push(`Unknown style: ${body.style}`);
  if (!promptBuilder.SCENARIOS[body.scenario]) errors.push(`Unknown scenario: ${body.scenario}`);
  if (!promptBuilder.SUBJECT_MODES[body.subjectMode]) errors.push(`Unknown subjectMode: ${body.subjectMode}`);
  const details = Array.isArray(body.details) ? body.details : [];
  for (const d of details) {
    if (!promptBuilder.DETAILS[d]) errors.push(`Unknown detail: ${d}`);
  }
  if (body.note && String(body.note).length > MAX_NOTE_LENGTH * 2) {
    errors.push('Note is too long.');
  }
  return errors;
}

function createApp() {
  const app = express();
  app.use(express.json({ limit: '32kb' }));

  // --- Static UI assets (explicit folder only — never the whole repo) ---
  app.use(express.static(PUBLIC_DIR, { index: 'index.html' }));

  // --- Reference photo thumbnails, allowlisted against the tiles manifest ---
  app.get('/photos/:name', (req, res) => {
    try {
      const manifestNames = paths.readTilesManifest();
      const filePath = paths.resolveAllowedPhoto(req.params.name, manifestNames);
      res.setHeader('Content-Type', extForPhoto(req.params.name));
      res.setHeader('Cache-Control', 'no-store');
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      jsonError(res, 400, err.message);
    }
  });

  // --- Candidate images for the review gallery ---
  app.get('/api/candidate-image/:jobId/:file', (req, res) => {
    try {
      const { filePath } = paths.resolveCandidatePath(req.params.jobId, req.params.file);
      if (!fs.existsSync(filePath)) return jsonError(res, 404, 'Candidate not found.');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store');
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      jsonError(res, 400, err.message);
    }
  });

  // --- Approved exports, served for the review UI's "already approved" view ---
  app.get('/api/generated-image/:file', (req, res) => {
    try {
      const filePath = paths.resolveGeneratedPath(req.params.file);
      if (!fs.existsSync(filePath)) return jsonError(res, 404, 'File not found.');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store');
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      jsonError(res, 400, err.message);
    }
  });

  app.get('/api/status', (req, res) => {
    res.json({ configured: openaiClient.isConfigured(), model: openaiClient.getModel() });
  });

  app.get('/api/options', (req, res) => {
    res.json(promptBuilder.listOptions());
  });

  app.get('/api/photos', (req, res) => {
    try {
      const names = paths.readTilesManifest();
      res.json({ photos: names.map((name) => ({ name, url: `/photos/${encodeURIComponent(name)}` })) });
    } catch (err) {
      jsonError(res, 500, `Could not read tiles manifest: ${err.message}`);
    }
  });

  app.get('/api/jobs', (req, res) => {
    try {
      res.json({ jobs: store.listJobs() });
    } catch (err) {
      jsonError(res, 500, `Could not list jobs: ${err.message}`);
    }
  });

  app.post('/api/generate', async (req, res) => {
    const body = req.body || {};
    const validationErrors = validateSelectionsBody(body);
    if (validationErrors.length) {
      return jsonError(res, 400, 'Invalid selections.', validationErrors);
    }

    if (!openaiClient.isConfigured()) {
      return jsonError(res, 400, 'OPENAI_API_KEY is not set in this server process. Set it and restart the server, then try again.');
    }

    let manifestNames;
    try {
      manifestNames = paths.readTilesManifest();
    } catch (err) {
      return jsonError(res, 500, `Could not read tiles manifest: ${err.message}`);
    }

    let resolvedPhotoPaths;
    try {
      resolvedPhotoPaths = body.photos.map((name) => ({
        name,
        path: paths.resolveAllowedPhoto(name, manifestNames),
      }));
    } catch (err) {
      return jsonError(res, 400, `Invalid reference photo selection: ${err.message}`);
    }

    const selections = {
      style: body.style,
      scenario: body.scenario,
      subjectMode: body.subjectMode,
      details: Array.isArray(body.details) ? body.details : [],
      note: promptBuilder.sanitizeNote(body.note),
    };

    let prompt;
    try {
      prompt = promptBuilder.buildPrompt({ ...selections, referenceCount: resolvedPhotoPaths.length });
    } catch (err) {
      return jsonError(res, 400, `Could not build prompt: ${err.message}`);
    }

    // Only the photos explicitly selected in this request are ever read/sent.
    let referenceBuffers;
    try {
      referenceBuffers = resolvedPhotoPaths.map((p) => ({
        buffer: fs.readFileSync(p.path),
        filename: p.name,
        mimeType: extForPhoto(p.name),
      }));
    } catch (err) {
      return jsonError(res, 500, `Could not read selected photo(s): ${err.message}`);
    }

    let result;
    try {
      result = await openaiClient.generateCandidates({
        referenceBuffers,
        prompt,
        count: body.count,
        size: body.size,
        outputFormat: 'png',
      });
    } catch (err) {
      return jsonError(res, 502, `Image generation failed: ${err.message}`);
    }

    let candidateBuffers;
    try {
      candidateBuffers = result.images.map((img) => Buffer.from(img.b64Json, 'base64'));
    } catch (err) {
      return jsonError(res, 502, `Could not decode generated image(s): ${err.message}`);
    }

    let job;
    try {
      job = store.createJob({
        sourcePhotos: resolvedPhotoPaths.map((p) => p.name),
        selections,
        prompt,
        model: result.model,
        requestId: result.requestId,
        candidateBuffers,
      });
    } catch (err) {
      return jsonError(res, 500, `Generated images but failed to save them: ${err.message}`);
    }

    res.json({ job });
  });

  app.post('/api/approve', (req, res) => {
    const { jobId, file } = req.body || {};
    try {
      const result = store.approveCandidate(jobId, file);
      res.json({ exportedFile: result.exportName, job: result.metadata });
    } catch (err) {
      jsonError(res, 400, `Could not approve candidate: ${err.message}`);
    }
  });

  app.post('/api/reject', (req, res) => {
    const { jobId, file } = req.body || {};
    try {
      const metadata = store.rejectCandidate(jobId, file);
      res.json({ job: metadata });
    } catch (err) {
      jsonError(res, 400, `Could not reject candidate: ${err.message}`);
    }
  });

  // --- Rida Studio identity pack (owner-only setup for the production game) ---
  // Chooses 10 existing Tiles photos to use as OpenAI identity references in
  // production. Saved locally to .birthday-studio/rida-identity.json
  // (gitignored). Never exposes anything beyond the exact filenames chosen.
  app.get('/api/rida-identity', (req, res) => {
    try {
      const pack = identityStore.readIdentityPack();
      const photos = pack ? pack.photos : [];
      res.json({
        count: photos.length,
        photos,
        savedAt: pack ? pack.savedAt : null,
        renderValue: photos.length ? identityStore.toRenderValue(photos) : '',
      });
    } catch (err) {
      jsonError(res, 500, `Could not read identity pack: ${err.message}`);
    }
  });

  app.post('/api/rida-identity', (req, res) => {
    const { photos } = req.body || {};
    let manifestNames;
    try {
      manifestNames = paths.readTilesManifest();
    } catch (err) {
      return jsonError(res, 500, `Could not read tiles manifest: ${err.message}`);
    }
    try {
      const record = identityStore.saveIdentityPack(photos, manifestNames);
      res.json({
        count: record.photos.length,
        photos: record.photos,
        savedAt: record.savedAt,
        renderValue: identityStore.toRenderValue(record.photos),
      });
    } catch (err) {
      jsonError(res, 400, `Could not save identity pack: ${err.message}`);
    }
  });

  // Explicit 404 for anything not matched above — never fall through to a
  // generic static file server over the rest of the repo.
  app.use((req, res) => {
    jsonError(res, 404, `Not found: ${req.method} ${req.path}`);
  });

  // Last-resort error handler — always returns explicit JSON, never a silent
  // failure or an HTML stack trace page.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    jsonError(res, 500, `Unexpected server error: ${err.message}`);
  });

  return app;
}

function start() {
  const port = Number(process.env.BIRTHDAY_STUDIO_PORT) || DEFAULT_PORT;
  const app = createApp();
  const server = app.listen(port, '127.0.0.1', () => {
    console.log('');
    console.log('  Birthday Image Studio (owner-only, local)');
    console.log(`  → http://127.0.0.1:${port}/`);
    console.log(`  API key configured: ${openaiClient.isConfigured() ? 'yes' : 'no'}`);
    console.log('  Selected photos are sent to OpenAI only when you press Generate.');
    console.log('');
  });
  return server;
}

module.exports = { createApp, start, DEFAULT_PORT };

if (require.main === module) {
  start();
}
