// Self-test suite for Fatema's Rida Studio (lib/ridaStudio).
// Run with: npm run rida-studio:selftest
//
// This suite NEVER calls OpenAI and NEVER reads real photo bytes — the
// generation flow is exercised with a synthetic, in-memory image and a
// faked OpenAI client. A fetch guard fails loudly if anything ever tries to
// reach api.openai.com.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const express = require('express');

const options = require('./options');
const promptBuilder = require('./promptBuilder');
const identity = require('./identity');
const session = require('./session');
const rateLimit = require('./rateLimit');
const tilesPhotos = require('../shared/tilesPhotos');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failCount++;
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
    console.log(`  FAIL - ${name}`);
    console.log(`         ${err.message}`);
  }
}

// A real, minimal, valid 1x1 transparent PNG — synthetic, not a photo.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const SCRATCH_DIR = path.join(tilesPhotos.REPO_ROOT, '.birthday-studio', 'rida-selftest-scratch');
const SYNTHETIC_PHOTO_PATH = path.join(SCRATCH_DIR, 'synthetic-reference.png');

const VALID_SELECTIONS = {
  color: 'rosePearl',
  motif: 'floralVines',
  border: 'none',
  panel: 'none',
  style: 'storybook',
  location: 'parisCafe',
};

async function main() {
  console.log("Fatema's Rida Studio — self-test");
  console.log('=================================');

  // Guarantee no OpenAI network call could ever happen in this test process.
  const realFetch = global.fetch;
  global.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.includes('api.openai.com')) {
      throw new Error('TEST FAILURE: fetch() was called against OpenAI — self-test must never reach OpenAI.');
    }
    return realFetch(input, init);
  };

  console.log('\n[1] Options catalog + selection validation');

  test('lists options for all curated garment and scene categories', () => {
    const opts = options.listOptions();
    assert.ok(opts.colors.length >= 4);
    assert.ok(opts.motifs.length >= 4);
    assert.ok(opts.borders.length >= 4);
    assert.ok(opts.panels.length >= 4);
    assert.ok(opts.styles.length >= 4);
    assert.ok(opts.locations.length >= 4);
    assert.ok(opts.panels.some((item) => item.key === 'none'));
    assert.ok(opts.borders.some((item) => item.key === 'none'));
  });

  test('accepts a fully valid selections object', () => {
    assert.deepStrictEqual(options.validateSelections(VALID_SELECTIONS), []);
  });

  test('rejects an unknown value in any single field', () => {
    for (const field of Object.keys(VALID_SELECTIONS)) {
      const bad = { ...VALID_SELECTIONS, [field]: 'not-a-real-option' };
      const errors = options.validateSelections(bad);
      assert.ok(errors.length > 0, `expected an error for bad ${field}`);
    }
  });

  test('rejects a selections object missing a field', () => {
    const { color, ...rest } = VALID_SELECTIONS;
    const errors = options.validateSelections(rest);
    assert.ok(errors.some((e) => e.includes('color')));
  });

  console.log('\n[2] Locked prompt builder — required + forbidden content');

  test('builds a prompt containing the authentic rida definition and selections', () => {
    const prompt = promptBuilder.buildPrompt(VALID_SELECTIONS, { identityReferenceCount: 10 });
    assert.ok(prompt.includes('Dawoodi Bohra rida'));
    assert.ok(prompt.includes('pardi'));
    assert.ok(prompt.includes('ghagra'));
    assert.ok(prompt.includes('face flap folded gracefully to one side'));
    assert.ok(prompt.includes('full-length sleeves'));
    assert.ok(prompt.includes('integrated headpiece'));
    assert.ok(prompt.includes('mostly straight, column-like skirt'));
    assert.ok(prompt.includes('must not fan outward around her'));
    assert.ok(prompt.includes('blush rose-pink and pearl-white'));
    assert.ok(prompt.includes('floral vine'));
    assert.ok(prompt.includes('no separate decorative panel'));
    assert.ok(prompt.includes('no lace or nehl trim'));
    assert.ok(prompt.includes('Do not add embroidery'));
    assert.ok(prompt.includes('Paris café') || prompt.includes('Paris caf'));
    assert.ok(prompt.includes('birthday'));
    assert.ok(prompt.includes('distinctive face shape'));
    assert.ok(prompt.includes('10 attached reference photos'));
    assert.ok(prompt.includes('first reference as the primary facial reference'));
    assert.ok(prompt.includes('convincing real-life photograph'));
    assert.ok(prompt.includes('not an illustration, painting, cartoon, anime, chibi'));
  });

  test('prompt explicitly forbids sari/lehenga/abaya/hijab/gown/dress conversion', () => {
    const prompt = promptBuilder.buildPrompt(VALID_SELECTIONS, { referenceCount: 3 });
    assert.ok(prompt.includes('Do not convert this outfit into a sari'));
    assert.ok(prompt.includes('lehenga'));
    assert.ok(prompt.includes('abaya'));
    assert.ok(prompt.includes('burqa'));
    assert.ok(prompt.includes('niqab'));
    assert.ok(prompt.includes('hijab'));
    assert.ok(prompt.includes('western gown or dress'));
    assert.ok(prompt.includes('Do not show exposed hair'));
    assert.ok(prompt.includes('Do not cover her face or eyes'));
    assert.ok(prompt.includes('exposed hair, neck, shoulders, arms, or midriff'));
    assert.ok(prompt.includes('ball gown'));
    assert.ok(prompt.includes('circle skirt'));
  });

  test('base cloth and design each support uploaded, described, or selected modes', () => {
    const prompt = promptBuilder.buildPrompt({
      ...VALID_SELECTIONS,
      baseDescription: '',
      designDescription: '',
      embroideryDescription: 'Keep the flowers lightly spaced.',
    }, {
      identityReferenceCount: 10,
      hasBaseClothReference: true,
      hasDesignReference: true,
    });
    assert.ok(prompt.includes('first non-identity attached image strictly as the base-cloth reference'));
    assert.ok(prompt.includes('across both the pardi and ghagra'));
    assert.ok(prompt.includes('final attached image strictly as a tailoring-design reference'));
    assert.ok(!prompt.includes('Keep the flowers lightly spaced'));

    const describedPrompt = promptBuilder.buildPrompt({
      ...VALID_SELECTIONS,
      baseDescription: 'teal cotton with tiny flowers',
      designDescription: 'a narrow ivory panel and lace repeated on both pieces',
      embroideryDescription: '',
    }, { identityReferenceCount: 10 });
    assert.ok(describedPrompt.includes('teal cotton with tiny flowers'));
    assert.ok(describedPrompt.includes('narrow ivory panel and lace repeated on both pieces'));

    assert.throws(() => promptBuilder.buildPrompt({
      ...VALID_SELECTIONS,
      designDescription: 'x'.repeat(promptBuilder.MAX_DESCRIPTION_LENGTH + 1),
    }));
  });

  test('prompt forbids text/watermarks, sadness/horror, and exaggerated features', () => {
    const prompt = promptBuilder.buildPrompt(VALID_SELECTIONS, { referenceCount: 3 });
    assert.ok(prompt.includes('Do not include any text, captions, logos, or watermarks'));
    assert.ok(prompt.includes('sadness'));
    assert.ok(prompt.includes('sexualization'));
    assert.ok(prompt.includes('exaggerated'));
    assert.ok(prompt.includes('Do not beautify her into a generic model'));
  });

  test('prompt never guarantees the output ("generated" + "choosing")', () => {
    const prompt = promptBuilder.buildPrompt(VALID_SELECTIONS, { referenceCount: 3 });
    assert.ok(prompt.includes('generating and choosing a favorite'));
    assert.ok(prompt.includes('not a guaranteed likeness'));
  });

  test('buildPrompt throws on unknown/missing selection keys', () => {
    assert.throws(() => promptBuilder.buildPrompt({ ...VALID_SELECTIONS, style: 'nope' }));
    assert.throws(() => promptBuilder.buildPrompt({}));
  });

  console.log('\n[3] Identity reference-photo resolution (env + local fallback)');

  const manifestNames = tilesPhotos.readTilesManifest();
  assert.ok(manifestNames.length >= 11, 'need at least 11 manifest photos for this test suite');
  const realManifestSample = manifestNames.slice(0, 10);

  const originalEnvValue = process.env.RIDA_REFERENCE_PHOTOS;
  const existingLocalIdentityRaw = fs.existsSync(identity.RIDA_IDENTITY_PATH)
    ? fs.readFileSync(identity.RIDA_IDENTITY_PATH, 'utf8')
    : null;

  test('resolves exactly 10 valid manifest filenames from RIDA_REFERENCE_PHOTOS', () => {
    process.env.RIDA_REFERENCE_PHOTOS = realManifestSample.join(',');
    const { resolved, source } = identity.resolveIdentityPhotos(manifestNames);
    assert.strictEqual(resolved.length, 10);
    assert.strictEqual(source, 'env:RIDA_REFERENCE_PHOTOS');
  });

  test('rejects fewer or more than 10 filenames', () => {
    process.env.RIDA_REFERENCE_PHOTOS = realManifestSample.slice(0, 9).join(',');
    assert.throws(() => identity.resolveIdentityPhotos(manifestNames));
    process.env.RIDA_REFERENCE_PHOTOS = manifestNames.slice(0, 11).join(',');
    assert.throws(() => identity.resolveIdentityPhotos(manifestNames));
  });

  test('rejects a filename not present in the manifest', () => {
    process.env.RIDA_REFERENCE_PHOTOS = ['not-a-real-photo.jpg', ...realManifestSample.slice(0, 9)].join(',');
    assert.throws(() => identity.resolveIdentityPhotos(manifestNames));
  });

  test('rejects path traversal attempts in RIDA_REFERENCE_PHOTOS', () => {
    process.env.RIDA_REFERENCE_PHOTOS = ['../../server.js', ...realManifestSample.slice(0, 9)].join(',');
    assert.throws(() => identity.resolveIdentityPhotos(manifestNames));
    process.env.RIDA_REFERENCE_PHOTOS = [`${realManifestSample[0]}/../../../server.js`, ...realManifestSample.slice(1)].join(',');
    assert.throws(() => identity.resolveIdentityPhotos(manifestNames));
  });

  test('falls back to .birthday-studio/rida-identity.json when env var is unset', () => {
    delete process.env.RIDA_REFERENCE_PHOTOS;
    fs.mkdirSync(path.dirname(identity.RIDA_IDENTITY_PATH), { recursive: true });
    const tmpPath = `${identity.RIDA_IDENTITY_PATH}.selftest-tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify({ photos: realManifestSample, savedAt: new Date().toISOString() }, null, 2));
    fs.renameSync(tmpPath, identity.RIDA_IDENTITY_PATH);
    const { resolved, source } = identity.resolveIdentityPhotos(manifestNames);
    assert.strictEqual(resolved.length, 10);
    assert.strictEqual(source, '.birthday-studio/rida-identity.json');
  });

  test('cleanup: restore original RIDA_REFERENCE_PHOTOS env and local identity file', () => {
    if (originalEnvValue === undefined) delete process.env.RIDA_REFERENCE_PHOTOS;
    else process.env.RIDA_REFERENCE_PHOTOS = originalEnvValue;

    if (existingLocalIdentityRaw === null) {
      if (fs.existsSync(identity.RIDA_IDENTITY_PATH)) fs.unlinkSync(identity.RIDA_IDENTITY_PATH);
    } else {
      const tmpPath = `${identity.RIDA_IDENTITY_PATH}.selftest-restore`;
      fs.writeFileSync(tmpPath, existingLocalIdentityRaw);
      fs.renameSync(tmpPath, identity.RIDA_IDENTITY_PATH);
    }
    // Verify restoration is byte-identical to what existed before this suite ran.
    if (existingLocalIdentityRaw !== null) {
      assert.strictEqual(fs.readFileSync(identity.RIDA_IDENTITY_PATH, 'utf8'), existingLocalIdentityRaw);
    } else {
      assert.ok(!fs.existsSync(identity.RIDA_IDENTITY_PATH));
    }
  });

  console.log('\n[4] Session (PIN login), rate limiting, and concurrency');

  const originalPin = process.env.RIDA_STUDIO_PIN;
  process.env.RIDA_STUDIO_PIN = 'self-test-pin-9182';
  session._resetForTests();
  rateLimit._resetForTests();

  test('login fails with a wrong PIN', () => {
    assert.strictEqual(session.login('wrong-pin'), null);
  });

  test('five consecutive wrong PIN attempts trigger a timed lockout', () => {
    session._resetForTests();
    for (let i = 0; i < session.MAX_FAILED_ATTEMPTS - 1; i++) {
      assert.strictEqual(session.login('wrong-pin'), null);
    }
    assert.throws(
      () => session.login('wrong-pin'),
      (err) => err.code === 'PIN_RATE_LIMITED' && err.retryAfterMs > 0,
    );
    assert.throws(
      () => session.login('self-test-pin-9182'),
      (err) => err.code === 'PIN_RATE_LIMITED',
    );
    session._resetForTests();
  });

  let loginResult;
  test('login succeeds with the correct injected PIN and returns an opaque token', () => {
    loginResult = session.login('self-test-pin-9182');
    assert.ok(loginResult && typeof loginResult.token === 'string' && loginResult.token.length >= 32);
    assert.ok(session.isValid(loginResult.token));
  });

  test('logout invalidates the session token', () => {
    const temp = session.login('self-test-pin-9182');
    assert.ok(session.isValid(temp.token));
    session.logout(temp.token);
    assert.strictEqual(session.isValid(temp.token), false);
  });

  test('rate limiter grants exactly DAILY_LIMIT successful generations then blocks', () => {
    const token = 'rate-limit-test-token';
    rateLimit._resetForTests();
    for (let i = 0; i < rateLimit.DAILY_LIMIT; i++) {
      const gate = rateLimit.beginGeneration(token);
      assert.strictEqual(gate.ok, true, `expected slot ${i} to be granted`);
      rateLimit.endGeneration(token, { success: true });
    }
    assert.strictEqual(rateLimit.remaining(token), 0);
    const blocked = rateLimit.beginGeneration(token);
    assert.strictEqual(blocked.ok, false);
    assert.strictEqual(blocked.reason, 'limit_reached');
  });

  test('failed generations do not consume daily allowance', () => {
    const token = 'rate-limit-failure-token';
    rateLimit._resetForTests();
    const gate = rateLimit.beginGeneration(token);
    assert.strictEqual(gate.ok, true);
    rateLimit.endGeneration(token, { success: false });
    assert.strictEqual(rateLimit.remaining(token), rateLimit.DAILY_LIMIT);
  });

  test('daily allowance remains shared across different session tokens', () => {
    rateLimit._resetForTests();
    const gate = rateLimit.beginGeneration('rida-studio-pin-user');
    assert.strictEqual(gate.ok, true);
    rateLimit.endGeneration('rida-studio-pin-user', { success: true });
    assert.strictEqual(rateLimit.remaining('rida-studio-pin-user'), rateLimit.DAILY_LIMIT - 1);
  });

  test('concurrent generation attempts for the same session are rejected', () => {
    const token = 'concurrency-test-token';
    rateLimit._resetForTests();
    const first = rateLimit.beginGeneration(token);
    assert.strictEqual(first.ok, true);
    const second = rateLimit.beginGeneration(token);
    assert.strictEqual(second.ok, false);
    assert.strictEqual(second.reason, 'in_progress');
    rateLimit.endGeneration(token, { success: true });
    const third = rateLimit.beginGeneration(token);
    assert.strictEqual(third.ok, true);
    rateLimit.endGeneration(token, { success: false });
  });

  rateLimit._resetForTests();

  console.log('\n[5] HTTP router — auth, no-store headers, generation flow (faked OpenAI)');

  // Synthetic scratch photo — never a real photo — used only so the /generate
  // route has bytes to read without ever touching public/tiles/photos.
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  fs.writeFileSync(SYNTHETIC_PHOTO_PATH, Buffer.from(TINY_PNG_BASE64, 'base64'));

  const identityModule = require('./identity');
  const originalResolveIdentityPhotos = identityModule.resolveIdentityPhotos;
  identityModule.resolveIdentityPhotos = () => ({
    resolved: Array.from({ length: 10 }, () => ({
      name: 'synthetic-reference.png',
      path: SYNTHETIC_PHOTO_PATH,
    })),
    source: 'test-fake',
  });

  const openaiImagesClient = require('../shared/openaiImagesClient');
  const originalGenerateImageEdits = openaiImagesClient.generateImageEdits;

  await testAsync('shared OpenAI client aborts a request after its configured timeout', async () => {
    const guardedFetch = global.fetch;
    global.fetch = (input, init) => new Promise((resolve, reject) => {
      const keepAlive = setTimeout(() => reject(new Error('Timeout signal did not fire.')), 200);
      init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
      init.signal.addEventListener('abort', () => clearTimeout(keepAlive), { once: true });
    });
    try {
      await assert.rejects(
        () => openaiImagesClient.generateImageEdits({
          apiKey: 'sk-fake-test-key-not-real',
          referenceBuffers: [{
            buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
            filename: 'synthetic.png',
            mimeType: 'image/png',
          }],
          prompt: 'Synthetic timeout test.',
          n: 1,
          timeoutMs: 20,
        }),
        (err) => err.code === 'OPENAI_TIMEOUT',
      );
    } finally {
      global.fetch = guardedFetch;
    }
  });

  let fakeCallCount = 0;
  let lastFakeRequest = null;
  openaiImagesClient.generateImageEdits = async (request) => {
    const { n } = request;
    fakeCallCount++;
    lastFakeRequest = request;
    await new Promise((resolve) => setTimeout(resolve, 30));
    return {
      model: 'fake-test-model',
      requestId: 'fake-request-id',
      images: Array.from({ length: n }, (_, i) => ({ b64Json: Buffer.from(`fake-image-${i}`).toString('base64') })),
    };
  };

  process.env.OPENAI_API_KEY = 'sk-fake-test-key-not-real';

  const router = require('./router');
  test('Rida Studio unlocks on September 6 UTC and remains available', () => {
    assert.strictEqual(router.isStudioReleased(new Date('2026-09-05T23:59:59.999Z')), false);
    assert.strictEqual(router.isStudioReleased(new Date('2026-09-06T00:00:00.000Z')), true);
    assert.strictEqual(router.isStudioReleased(new Date('2027-01-01T00:00:00.000Z')), true);
  });

  const app = express();
  app.use('/rida-studio/api', router.createRouter({
    now: () => new Date('2026-09-06T00:00:00.000Z'),
  }));
  const httpServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => httpServer.once('listening', resolve));
  const port = httpServer.address().port;
  const base = `http://127.0.0.1:${port}/rida-studio/api`;

  function extractCookie(res) {
    const raw = res.headers.get('set-cookie');
    if (!raw) return null;
    return raw.split(';')[0];
  }

  await testAsync('GET /session with no cookie reports authenticated=false', async () => {
    const res = await fetch(`${base}/session`);
    const body = await res.json();
    assert.strictEqual(body.authenticated, false);
    assert.strictEqual(res.headers.get('cache-control'), 'no-store');
  });

  await testAsync('POST /generate without auth is rejected (401)', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_SELECTIONS),
    });
    assert.strictEqual(res.status, 401);
  });

  await testAsync('POST /login rejects a wrong PIN with 401', async () => {
    const res = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'totally-wrong' }),
    });
    assert.strictEqual(res.status, 401);
  });

  await testAsync('POST /login rate-limits repeated incorrect PIN attempts', async () => {
    let finalResponse;
    for (let i = 1; i < session.MAX_FAILED_ATTEMPTS; i++) {
      finalResponse = await fetch(`${base}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: 'still-wrong' }),
      });
    }
    assert.strictEqual(finalResponse.status, 429);
    assert.ok(Number(finalResponse.headers.get('retry-after')) > 0);
    session._resetForTests();
  });

  let sessionCookie;
  await testAsync('POST /login succeeds with correct PIN, sets HttpOnly SameSite=Strict cookie', async () => {
    const res = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'self-test-pin-9182' }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('cache-control'), 'no-store');
    const setCookie = res.headers.get('set-cookie') || '';
    assert.ok(setCookie.includes('HttpOnly'));
    assert.ok(setCookie.includes('SameSite=Strict'));
    sessionCookie = extractCookie(res);
    assert.ok(sessionCookie);
  });

  await testAsync('GET /options with valid session cookie returns the full catalog + remaining allowance', async () => {
    const res = await fetch(`${base}/options`, { headers: { Cookie: sessionCookie } });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.options.colors.length > 0);
    assert.strictEqual(body.remaining, rateLimit.DAILY_LIMIT);
  });

  await testAsync('POST /generate rejects unknown option values (400)', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ ...VALID_SELECTIONS, color: 'not-real' }),
    });
    assert.strictEqual(res.status, 400);
  });

  await testAsync('POST /generate rejects unexpected fields outside the bounded design inputs', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ ...VALID_SELECTIONS, note: 'please make it extra special' }),
    });

    await testAsync('POST /generate rejects invalid base-cloth bytes', async () => {
      const res = await fetch(`${base}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({
          ...VALID_SELECTIONS,
          baseClothPhoto: { mimeType: 'image/png', base64: Buffer.from('not-a-png-image').toString('base64') },
        }),
      });
      assert.strictEqual(res.status, 400);
    });
    assert.strictEqual(res.status, 400);
  });

  await testAsync('POST /generate succeeds and returns exactly two b64 images with no-store headers', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify(VALID_SELECTIONS),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('cache-control'), 'no-store');
    const body = await res.json();
    assert.strictEqual(body.images.length, 2);
    for (const img of body.images) assert.strictEqual(typeof img, 'string');
    assert.strictEqual(body.remaining, rateLimit.DAILY_LIMIT - 1);
    assert.strictEqual(lastFakeRequest.referenceBuffers.length, 10);
  });

  await testAsync('POST /generate appends base-cloth and design references after the 10 identity photos', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        ...VALID_SELECTIONS,
        baseDescription: '',
        designDescription: '',
        embroideryDescription: '',
        baseClothPhoto: { mimeType: 'image/png', base64: TINY_PNG_BASE64 },
        designPhoto: { mimeType: 'image/png', base64: TINY_PNG_BASE64 },
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(lastFakeRequest.referenceBuffers.length, 12);
    assert.strictEqual(lastFakeRequest.referenceBuffers[10].filename, 'uploaded-base-cloth-photo.png');
    assert.strictEqual(lastFakeRequest.referenceBuffers[11].filename, 'uploaded-design-example-photo.png');
    assert.ok(lastFakeRequest.prompt.includes('first non-identity attached image strictly as the base-cloth reference'));
    assert.ok(lastFakeRequest.prompt.includes('final attached image strictly as a tailoring-design reference'));
  });

  await testAsync('concurrent POST /generate for the same session: one succeeds, one is rejected (409)', async () => {
    const before = fakeCallCount;
    const [resA, resB] = await Promise.all([
      fetch(`${base}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify(VALID_SELECTIONS),
      }),
      fetch(`${base}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify(VALID_SELECTIONS),
      }),
    ]);
    const statuses = [resA.status, resB.status].sort();
    assert.deepStrictEqual(statuses, [200, 409]);
    assert.strictEqual(fakeCallCount, before + 1);
  });

  await testAsync('logging out and back in does not reset the daily allowance', async () => {
    const beforeRes = await fetch(`${base}/session`, { headers: { Cookie: sessionCookie } });
    const beforeBody = await beforeRes.json();

    await fetch(`${base}/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const loginRes = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'self-test-pin-9182' }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginBody = await loginRes.json();
    assert.strictEqual(loginBody.remaining, beforeBody.remaining);
    sessionCookie = extractCookie(loginRes);
  });

  await testAsync('POST /logout clears the session so /options is rejected afterward', async () => {
    const logoutRes = await fetch(`${base}/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(logoutRes.status, 200);
    const optionsRes = await fetch(`${base}/options`, { headers: { Cookie: sessionCookie } });
    assert.strictEqual(optionsRes.status, 401);
  });

  await testAsync('unknown route under the router returns explicit JSON 404', async () => {
    const res = await fetch(`${base}/definitely-not-a-real-route`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.ok(typeof body.error === 'string');
  });

  httpServer.close();
  global.fetch = realFetch;
  identityModule.resolveIdentityPhotos = originalResolveIdentityPhotos;
  openaiImagesClient.generateImageEdits = originalGenerateImageEdits;
  if (originalPin === undefined) delete process.env.RIDA_STUDIO_PIN;
  else process.env.RIDA_STUDIO_PIN = originalPin;
  delete process.env.OPENAI_API_KEY;
  session._resetForTests();
  rateLimit._resetForTests();
  fs.rmSync(SCRATCH_DIR, { recursive: true, force: true });

  console.log('\n=================================');
  console.log(`${passCount} passed, ${failCount} failed`);
  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Self-test crashed:', err);
  process.exitCode = 1;
});
