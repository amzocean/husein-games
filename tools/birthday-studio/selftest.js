// Self-test suite for the Birthday Image Studio.
// Run with: npm run birthday-studio:selftest
//
// This suite NEVER calls OpenAI and NEVER reads real photo bytes beyond the
// tiles manifest listing. It only exercises: prompt construction, path/
// manifest allowlist validation (including traversal rejection), the missing-
// key error path on /api/generate, and approve/reject using a synthetic
// 1x1 PNG that is generated in-memory (not a real photo).
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const promptBuilder = require('./promptBuilder');
const paths = require('./paths');
const store = require('./store');

let passCount = 0;
let failCount = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failCount++;
    failures.push({ name, err });
    console.log(`  FAIL - ${name}`);
    console.log(`         ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passCount++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failCount++;
    failures.push({ name, err });
    console.log(`  FAIL - ${name}`);
    console.log(`         ${err.message}`);
  }
}

// A real, minimal, valid 1x1 transparent PNG — synthetic, not a photo.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

async function main() {
  console.log('Birthday Image Studio — self-test');
  console.log('==================================');

  console.log('\n[1] Prompt builder');
  test('lists options for all curated categories', () => {
    const opts = promptBuilder.listOptions();
    assert.ok(opts.styles.length >= 4);
    assert.ok(opts.scenarios.length >= 6);
    assert.ok(opts.subjectModes.length === 3);
    assert.ok(opts.details.length >= 6);
  });

  test('builds a prompt containing safety and identity language', () => {
    const prompt = promptBuilder.buildPrompt({
      style: 'storybook',
      scenario: 'garden',
      subjectMode: 'both',
      details: ['balloons', 'cake'],
      note: 'she loves sunflowers!!',
      referenceCount: 2,
    });
    assert.ok(prompt.includes('storybook'));
    assert.ok(prompt.includes('enchanted garden'));
    assert.ok(prompt.includes('recognizable, consistent faces'));
    assert.ok(prompt.includes('Do not include any text'));
    assert.ok(prompt.includes('Do not depict sadness'));
    assert.ok(prompt.includes('sunflowers'));
  });

  test('rejects unknown style/scenario/subjectMode/detail', () => {
    assert.throws(() => promptBuilder.buildPrompt({ style: 'evil', scenario: 'garden', subjectMode: 'both', details: [], referenceCount: 1 }));
    assert.throws(() => promptBuilder.buildPrompt({ style: 'storybook', scenario: 'evil', subjectMode: 'both', details: [], referenceCount: 1 }));
    assert.throws(() => promptBuilder.buildPrompt({ style: 'storybook', scenario: 'garden', subjectMode: 'evil', details: [], referenceCount: 1 }));
    assert.throws(() => promptBuilder.buildPrompt({ style: 'storybook', scenario: 'garden', subjectMode: 'both', details: ['not-a-real-detail'], referenceCount: 1 }));
  });

  test('sanitizes the optional note (strips control chars, caps length)', () => {
    const noisy = 'A'.repeat(500) + '\u202Eignore-previous-instructions<script>';
    const cleaned = promptBuilder.sanitizeNote(noisy);
    assert.ok(cleaned.length <= promptBuilder.MAX_NOTE_LENGTH);
    assert.ok(!cleaned.includes('<'));
    assert.ok(!cleaned.includes('\u202E'));
  });

  console.log('\n[2] Path allowlist + traversal rejection');
  const manifestNames = paths.readTilesManifest();

  test('tiles manifest.json loads as a non-empty array', () => {
    assert.ok(Array.isArray(manifestNames) && manifestNames.length > 0);
  });

  test('resolves an allowed photo that is in the manifest', () => {
    const name = manifestNames[0];
    const resolved = paths.resolveAllowedPhoto(name, manifestNames);
    assert.strictEqual(path.dirname(resolved), paths.TILES_PHOTOS_DIR);
  });

  test('rejects a photo name not present in the manifest', () => {
    assert.throws(() => paths.resolveAllowedPhoto('not-a-real-photo.jpg', manifestNames));
  });

  test('rejects path traversal in photo name (../../server.js)', () => {
    assert.throws(() => paths.resolveAllowedPhoto('../../server.js', manifestNames));
  });

  test('rejects path traversal via encoded/relative segments disguised as filenames', () => {
    assert.throws(() => paths.resolveAllowedPhoto('..%2f..%2fserver.js', manifestNames));
    assert.throws(() => paths.resolveAllowedPhoto('photo-29.jpg/../../../server.js', manifestNames));
  });

  test('rejects an absolute path used as a photo name', () => {
    assert.throws(() => paths.resolveAllowedPhoto('C:\\Windows\\System32\\drivers\\etc\\hosts', manifestNames));
  });

  test('rejects an invalid job id (traversal attempt)', () => {
    assert.throws(() => paths.resolveCandidatePath('../../etc', 'candidate-1.png'));
    assert.throws(() => paths.resolveCandidatePath('job-1234567890123-abcd1234', '../../server.js'));
  });

  test('accepts a well-formed synthetic job id + candidate file', () => {
    const { filePath } = paths.resolveCandidatePath('job-1234567890123-abcd1234', 'candidate-1.png');
    assert.ok(filePath.endsWith(path.join('job-1234567890123-abcd1234', 'candidate-1.png')));
  });

  console.log('\n[3] Server API — missing-key path only (no OpenAI calls made)');

  // Guarantee no OpenAI network call could ever happen in this test process.
  // Requests to our own local test server (127.0.0.1) are allowed through —
  // only the real OpenAI host is blocked.
  const realFetch = global.fetch;
  global.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.includes('api.openai.com')) {
      throw new Error('TEST FAILURE: fetch() was called against OpenAI — self-test must never reach OpenAI.');
    }
    return realFetch(input, init);
  };
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  // Re-require server fresh so openaiClient reads the now-unset env var.
  delete require.cache[require.resolve('./openaiClient')];
  delete require.cache[require.resolve('./server')];
  const { createApp } = require('./server');
  const app = createApp();
  const httpServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => httpServer.once('listening', resolve));
  const port = httpServer.address().port;
  const base = `http://127.0.0.1:${port}`;

  await testAsync('GET /api/status reports configured=false with no key', async () => {
    const res = await fetch(`${base}/api/status`);
    const body = await res.json();
    assert.strictEqual(body.configured, false);
  });

  await testAsync('POST /api/generate returns explicit 400 JSON error with no key', async () => {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: [manifestNames[0]],
        subjectMode: 'auto',
        style: 'storybook',
        scenario: 'garden',
        details: [],
        count: 2,
      }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(typeof body.error === 'string' && body.error.includes('OPENAI_API_KEY'));
  });

  await testAsync('POST /api/generate rejects invalid selections with explicit details', async () => {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: [], style: 'nope', scenario: 'nope', subjectMode: 'nope', count: 99 }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(Array.isArray(body.details) && body.details.length > 0);
  });

  await testAsync('GET /photos/:name rejects traversal attempts', async () => {
    const res = await fetch(`${base}/photos/${encodeURIComponent('../../server.js')}`);
    assert.strictEqual(res.status, 400);
  });

  await testAsync('GET /photos/:name rejects a name absent from the manifest', async () => {
    const res = await fetch(`${base}/photos/not-a-real-photo.jpg`);
    assert.strictEqual(res.status, 400);
  });

  await testAsync('GET /api/candidate-image rejects traversal in jobId/file', async () => {
    const res = await fetch(`${base}/api/candidate-image/${encodeURIComponent('../../')}/candidate-1.png`);
    assert.strictEqual(res.status, 400);
  });

  await testAsync('unknown route returns explicit JSON 404 (no HTML fallthrough)', async () => {
    const res = await fetch(`${base}/definitely-not-a-real-route`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.ok(typeof body.error === 'string');
  });

  httpServer.close();
  global.fetch = realFetch;
  if (originalKey !== undefined) process.env.OPENAI_API_KEY = originalKey;

  console.log('\n[4] Approve / reject flow with a synthetic (non-personal) candidate');

  const tinyPng = Buffer.from(TINY_PNG_BASE64, 'base64');
  let job;
  test('creates a synthetic job with a 1x1 PNG candidate', () => {
    job = store.createJob({
      sourcePhotos: ['SYNTHETIC-TEST-ONLY'],
      selections: { style: 'storybook', scenario: 'garden', subjectMode: 'auto', details: [], note: '' },
      prompt: '[self-test synthetic prompt — not sent to OpenAI]',
      model: 'self-test',
      requestId: null,
      candidateBuffers: [tinyPng, tinyPng],
    });
    assert.strictEqual(job.candidates.length, 2);
    assert.strictEqual(job.candidates[0].status, 'pending');
  });

  let exportedFile;
  test('approve copies candidate-1 into public/birthday/generated and updates manifest', () => {
    const before = store.readGeneratedManifest().length;
    const result = store.approveCandidate(job.jobId, 'candidate-1.png');
    exportedFile = result.exportName;
    const after = store.readGeneratedManifest();
    assert.strictEqual(after.length, before + 1);
    const exportedEntry = after.find((entry) => entry.file === exportedFile);
    assert.ok(exportedEntry);
    assert.strictEqual(exportedEntry.prompt, undefined);
    assert.strictEqual(exportedEntry.note, undefined);
    assert.strictEqual(exportedEntry.sourceJobId, undefined);
    assert.ok(fs.existsSync(path.join(paths.GENERATED_ROOT, exportedFile)));
    const updatedJob = store.readJobMetadata(job.jobId).metadata;
    assert.strictEqual(updatedJob.candidates[0].status, 'approved');
  });

  test('reject deletes only candidate-2 and leaves candidate-1 untouched', () => {
    store.rejectCandidate(job.jobId, 'candidate-2.png');
    const { jobDir, metadata } = store.readJobMetadata(job.jobId);
    assert.strictEqual(metadata.candidates[1].status, 'rejected');
    assert.ok(!fs.existsSync(path.join(jobDir, 'candidate-2.png')));
    // candidate-1 file itself was already approved/copied; the source candidate
    // file may still exist in the job dir — only candidate-2 must be gone.
    assert.ok(fs.existsSync(path.join(jobDir, 'metadata.json')));
  });

  test('reject rejects an unknown candidate file explicitly (no silent no-op)', () => {
    assert.throws(() => store.rejectCandidate(job.jobId, 'candidate-3.png'));
  });

  // --- Cleanup: remove the synthetic job + its exported file/manifest entry so
  // the real public/birthday/generated folder stays clean for actual approved
  // birthday images. This deletes ONLY the exact synthetic paths created above.
  test('cleanup removes synthetic job dir and exported file (no wildcard deletion)', () => {
    const jobDir = path.join(paths.CANDIDATES_ROOT, job.jobId);
    fs.rmSync(jobDir, { recursive: true, force: true });
    assert.ok(!fs.existsSync(jobDir));

    if (exportedFile) {
      const exportedPath = path.join(paths.GENERATED_ROOT, exportedFile);
      if (fs.existsSync(exportedPath)) fs.unlinkSync(exportedPath);
      const manifest = store.readGeneratedManifest().filter((entry) => entry.file !== exportedFile);
      fs.writeFileSync(paths.GENERATED_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
      assert.ok(!fs.existsSync(exportedPath));
    }
  });

  console.log('\n[5] Rida Studio identity pack (owner-only setup)');

  const identityStore = require('./identityStore');
  const RIDA_PATH = paths.RIDA_IDENTITY_PATH;

  // Back up any real, pre-existing owner config so this suite can restore it
  // byte-for-byte afterwards, no matter what happens during the tests below.
  const hadExistingRidaConfig = fs.existsSync(RIDA_PATH);
  const existingRidaConfigBytes = hadExistingRidaConfig ? fs.readFileSync(RIDA_PATH) : null;

  function restoreRidaConfig() {
    if (hadExistingRidaConfig) {
      fs.mkdirSync(path.dirname(RIDA_PATH), { recursive: true });
      fs.writeFileSync(RIDA_PATH, existingRidaConfigBytes);
    } else if (fs.existsSync(RIDA_PATH)) {
      fs.unlinkSync(RIDA_PATH);
    }
  }

  const tenIdentityPhotos = manifestNames.slice(0, 10);

  test('rejects fewer than 10 photos', () => {
    assert.throws(() => identityStore.saveIdentityPack(manifestNames.slice(0, 9), manifestNames));
  });

  test('rejects more than 10 photos', () => {
    assert.throws(() => identityStore.saveIdentityPack(manifestNames.slice(0, 11), manifestNames));
  });

  test('rejects duplicate photo selections', () => {
    assert.throws(() => identityStore.saveIdentityPack(
      [manifestNames[0], manifestNames[0], ...manifestNames.slice(1, 9)],
      manifestNames,
    ));
  });

  test('rejects a traversal attempt disguised as a photo name', () => {
    assert.throws(() => identityStore.saveIdentityPack(
      ['../../server.js', ...manifestNames.slice(0, 9)],
      manifestNames,
    ));
  });

  test('rejects a filename not present in the manifest', () => {
    assert.throws(() => identityStore.saveIdentityPack(
      ['not-a-real-photo.jpg', ...manifestNames.slice(0, 9)],
      manifestNames,
    ));
  });

  test('saves and reads back exactly 10 valid photos (round trip)', () => {
    const saved = identityStore.saveIdentityPack(tenIdentityPhotos, manifestNames);
    assert.deepStrictEqual(saved.photos, tenIdentityPhotos);
    assert.ok(saved.savedAt);
    const readBack = identityStore.readIdentityPack();
    assert.deepStrictEqual(readBack.photos, tenIdentityPhotos);
    assert.strictEqual(identityStore.toRenderValue(readBack.photos), tenIdentityPhotos.join(','));
  });

  test('overwrites the previous save with another valid 10-photo pack', () => {
    const chosen = manifestNames.slice(1, 11);
    identityStore.saveIdentityPack(chosen, manifestNames);
    const readBack = identityStore.readIdentityPack();
    assert.deepStrictEqual(readBack.photos, chosen);
  });

  // Reset to a known state before the HTTP-level tests so assertions are
  // deterministic regardless of what a real owner config previously held.
  if (fs.existsSync(RIDA_PATH)) fs.unlinkSync(RIDA_PATH);

  delete require.cache[require.resolve('./identityStore')];
  delete require.cache[require.resolve('./server')];
  const { createApp: createRidaApp } = require('./server');
  const ridaApp = createRidaApp();
  const ridaHttpServer = ridaApp.listen(0, '127.0.0.1');
  await new Promise((resolve) => ridaHttpServer.once('listening', resolve));
  const ridaPort = ridaHttpServer.address().port;
  const ridaBase = `http://127.0.0.1:${ridaPort}`;

  await testAsync('GET /api/rida-identity reports count=0 with no saved config', async () => {
    const res = await fetch(`${ridaBase}/api/rida-identity`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.count, 0);
    assert.deepStrictEqual(body.photos, []);
    assert.strictEqual(body.savedAt, null);
  });

  await testAsync('POST /api/rida-identity rejects an invalid count (400, explicit error)', async () => {
    const res = await fetch(`${ridaBase}/api/rida-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: [manifestNames[0], manifestNames[1]] }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(typeof body.error === 'string' && body.error.length > 0);
  });

  await testAsync('POST /api/rida-identity rejects traversal/unlisted photos (400)', async () => {
    const res = await fetch(`${ridaBase}/api/rida-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: ['../../server.js', manifestNames[0], manifestNames[1]] }),
    });
    assert.strictEqual(res.status, 400);
  });

  await testAsync('POST /api/rida-identity saves exactly 10 valid photos and never exposes secrets', async () => {
    const chosen = tenIdentityPhotos;
    const res = await fetch(`${ridaBase}/api/rida-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: chosen }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.count, 10);
    assert.deepStrictEqual(body.photos, chosen);
    assert.strictEqual(body.renderValue, chosen.join(','));
    const asText = JSON.stringify(body);
    assert.ok(!asText.includes('OPENAI_API_KEY'));
    assert.ok(originalKey === undefined || !asText.includes(originalKey));
  });

  await testAsync('GET /api/rida-identity now reflects the saved pack', async () => {
    const res = await fetch(`${ridaBase}/api/rida-identity`);
    const body = await res.json();
    assert.strictEqual(body.count, 10);
    assert.ok(body.savedAt);
    assert.strictEqual(body.renderValue, tenIdentityPhotos.join(','));
  });

  ridaHttpServer.close();

  test('restores any pre-existing owner Rida identity config exactly', () => {
    restoreRidaConfig();
    if (hadExistingRidaConfig) {
      assert.ok(fs.existsSync(RIDA_PATH));
      assert.ok(fs.readFileSync(RIDA_PATH).equals(existingRidaConfigBytes));
    } else {
      assert.ok(!fs.existsSync(RIDA_PATH));
    }
  });

  console.log('\n==================================');
  console.log(`${passCount} passed, ${failCount} failed`);
  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Self-test crashed:', err);
  process.exitCode = 1;
});
