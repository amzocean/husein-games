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
const referenceSpec = require('./referenceSpec');
const analysisToken = require('./analysisToken');
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
const BASE_ANALYSIS = {
  role: 'base_cloth',
  sourceType: 'worn_rida',
  baseRelationship: 'same_on_both',
  baseCloth: 'pale lilac cloth with repeated small purple floral motifs',
  designLayers: [],
  embroideryAboveDesign: '',
  summary: 'Pale lilac floral cloth will be used on both pieces; lower trim is ignored.',
};
const DESIGN_ANALYSIS = {
  role: 'design',
  sourceType: 'design_only',
  baseRelationship: 'not_applicable',
  baseCloth: '',
  designLayers: [
    {
      type: 'panel',
      placement: 'bottom_design',
      appliesTo: 'both',
      verticalSize: 'standard_6_8',
      description: 'dusty-rose panel with scattered eyelet motifs',
    },
    {
      type: 'panel',
      placement: 'bottom_design',
      appliesTo: 'both',
      verticalSize: 'broad_8_10',
      description: 'broad vintage rose floral panel',
    },
    {
      type: 'lace',
      placement: 'bottom_edge',
      appliesTo: 'both',
      verticalSize: 'trim_1_3',
      description: 'ivory scalloped eyelet lace',
    },
  ],
  embroideryAboveDesign: '',
  summary: 'Two separate stacked panels followed by ivory bottom lace.',
};
const COMPLETE_ANALYSIS = {
  ...DESIGN_ANALYSIS,
  role: 'complete',
  baseRelationship: 'same_on_both',
  baseCloth: 'fine white and muted-rose vertical striped cloth',
  summary: 'Striped base cloth, two separate panels, then ivory lace on both pieces.',
};

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
    assert.strictEqual(opts.colors[0].key, 'surprise');
    assert.strictEqual(opts.motifs[0].key, 'surprise');
    assert.strictEqual(opts.borders[0].key, 'surprise');
    assert.strictEqual(opts.panels[0].key, 'surprise');
    assert.ok(opts.panels.some((item) => item.key === 'contrastPanel' && item.label.includes('Standard')));
    assert.ok(opts.panels.some((item) => item.key === 'coordinatedWide' && item.label.includes('Broad')));
    assert.ok(options.PANELS.contrastPanel.desc.includes('6-8 inches'));
    assert.ok(options.PANELS.coordinatedWide.desc.includes('8-10 inches'));
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

  test('normalizes context-specific structured reference analyses', () => {
    assert.deepStrictEqual(referenceSpec.normalizeReferenceSpec(BASE_ANALYSIS, 'base_cloth'), BASE_ANALYSIS);
    assert.deepStrictEqual(referenceSpec.normalizeReferenceSpec(DESIGN_ANALYSIS, 'design'), DESIGN_ANALYSIS);
    assert.deepStrictEqual(referenceSpec.normalizeReferenceSpec(COMPLETE_ANALYSIS, 'complete'), COMPLETE_ANALYSIS);
    assert.throws(() => referenceSpec.normalizeReferenceSpec(BASE_ANALYSIS, 'design'));
    assert.throws(() => referenceSpec.normalizeReferenceSpec({
      ...DESIGN_ANALYSIS,
      designLayers: [{ ...DESIGN_ANALYSIS.designLayers[0], unexpected: true }],
    }, 'design'));
  });

  test('analysis tokens bind a structured spec to session, role, and exact photo bytes', () => {
    const photoBuffer = Buffer.from(TINY_PNG_BASE64, 'base64');
    const token = analysisToken.createAnalysisToken({
      sessionToken: 'session-a',
      role: 'complete',
      photoBuffer,
      analysis: COMPLETE_ANALYSIS,
    });
    assert.deepStrictEqual(analysisToken.verifyAnalysisToken({
      token,
      sessionToken: 'session-a',
      role: 'complete',
      photoBuffer,
    }), COMPLETE_ANALYSIS);
    assert.throws(() => analysisToken.verifyAnalysisToken({
      token,
      sessionToken: 'session-b',
      role: 'complete',
      photoBuffer,
    }));
    assert.throws(() => analysisToken.verifyAnalysisToken({
      token,
      sessionToken: 'session-a',
      role: 'design',
      photoBuffer,
    }));
    assert.throws(() => analysisToken.verifyAnalysisToken({
      token,
      sessionToken: 'session-a',
      role: 'complete',
      photoBuffer: Buffer.from('different-photo'),
    }));
  });

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
    assert.ok(prompt.includes('reference image 1 as the primary face-and-body reference'));
    assert.ok(prompt.includes('reference images 2 through 10 as supporting face-and-body views'));
    assert.ok(prompt.includes('convincing real-life photograph'));
    assert.ok(prompt.includes('not an illustration, painting, cartoon, anime, chibi'));
    assert.ok(prompt.includes('5 feet 10 inches (178 cm)'));
    assert.ok(prompt.includes('naturally tall'));
    assert.ok(prompt.includes('Do not make her shorter, petite, thinner, narrower, heavier, taller, or younger'));
    assert.ok(prompt.includes('torso, shoulder, or limb proportions'));
    assert.ok(prompt.includes('shoulder breadth, torso width, hip width, arm thickness'));
    assert.ok(prompt.includes('visual impression that she is slimmer or smaller'));
    assert.ok(prompt.includes('ground truth for both her face and her natural adult body'));
    assert.ok(prompt.includes('standard panels at 6-8 inches'));
    assert.ok(prompt.includes('broad or wide panels at 8-10 inches'));
    assert.ok(prompt.includes('Never inflate a panel into an oversized quarter-skirt section'));
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
      baseClothAnalysis: BASE_ANALYSIS,
      baseClothCorrection: 'Use only the lilac repeating fabric.',
      designAnalysis: DESIGN_ANALYSIS,
      designCorrection: 'Keep both panels separate.',
    }, {
      identityReferenceCount: 10,
      hasBaseClothReference: true,
      hasDesignReference: true,
      baseClothReferenceIndex: 1,
      designReferenceIndex: 2,
      primaryIdentityReferenceIndex: 3,
      supportingIdentityStartIndex: 4,
    });

    test('surprise defaults create fresh designs without copying identity-reference clothing', () => {
      const prompt = promptBuilder.buildPrompt({
        ...VALID_SELECTIONS,
        color: 'surprise',
        motif: 'surprise',
        border: 'surprise',
        panel: 'surprise',
        baseDescription: '',
        designDescription: '',
        embroideryDescription: '',
      }, { identityReferenceCount: 10 });
      assert.ok(prompt.includes('ground truth for both her face and her natural adult body'));
      assert.ok(prompt.includes('clothing visible in Fatema\'s identity reference photos as incidental'));
      assert.ok(prompt.includes('Independently invent a fresh, harmonious base-cloth color palette'));
      assert.ok(prompt.includes('Independently invent a fresh, tasteful fabric motif'));
      assert.ok(prompt.includes('Independently invent a fresh coordinated panel treatment'));
      assert.ok(prompt.includes('Independently invent a fresh coordinated border or lace treatment'));
      assert.ok(prompt.includes('fresh combination distinct from every identity-reference outfit'));
    });
    assert.ok(prompt.includes('HIGHEST-PRIORITY BASE-CLOTH SOURCE'));
    assert.ok(prompt.includes('reference image 1 controls'));
    assert.ok(prompt.includes('areas of both the pardi and ghagra'));
    assert.ok(prompt.includes('reference image 2 is strictly the tailoring-design reference'));
    assert.ok(prompt.includes('CONFIRMED BASE-CLOTH INTERPRETATION'));
    assert.ok(prompt.includes('pale lilac cloth with repeated small purple floral motifs'));
    assert.ok(prompt.includes('USER-REQUESTED BASE-CLOTH CHANGE'));
    assert.ok(prompt.includes('CONFIRMED DESIGN-ONLY INTERPRETATION'));
    assert.ok(prompt.includes('Required top-to-bottom design order'));
    assert.ok(prompt.includes('6-8 inches high'));
    assert.ok(prompt.includes('8-10 inches high'));
    assert.ok(prompt.includes('1-3 inches high'));
    assert.ok(prompt.includes('rendered independently twice'));
    assert.ok(prompt.includes('Do not split or distribute layers between the pieces'));
    assert.ok(prompt.includes('never the entire ghaghro'));
    assert.ok(prompt.includes('Two separate stacked panels') || prompt.includes('dusty-rose panel'));
    assert.ok(prompt.includes('USER-REQUESTED DESIGN CHANGE'));
    assert.ok(prompt.includes('reference image 3 as the primary face-and-body reference'));
    assert.ok(prompt.includes('reference images 4 through 12 as supporting face-and-body views'));
    assert.ok(prompt.includes('advertisement, or another non-fabric image'));
    assert.ok(prompt.includes('transform its dominant colors'));
    assert.ok(prompt.includes('Never copy legible words'));
    assert.ok(prompt.includes('Do not substitute a merely similar palette'));
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

  test('complete mode validates its source and ignores guided garment choices', () => {
    assert.strictEqual(promptBuilder.normalizeDesignMode(undefined), 'guided');
    assert.strictEqual(promptBuilder.normalizeDesignMode('complete'), 'complete');
    assert.throws(() => promptBuilder.normalizeDesignMode('smart'));
    assert.throws(() => promptBuilder.buildPrompt({
      designMode: 'complete',
      style: 'storybook',
      location: 'parisCafe',
      completeRidaDescription: '   ',
    }, { identityReferenceCount: 10 }));

    const descriptionPrompt = promptBuilder.buildPrompt({
      designMode: 'complete',
      style: 'storybook',
      location: 'parisCafe',
      color: 'not-a-real-guided-color',
      motif: 'not-a-real-guided-motif',
      border: 'not-a-real-guided-border',
      panel: 'not-a-real-guided-panel',
      baseDescription: 'GUIDED BASE MUST BE IGNORED',
      designDescription: 'GUIDED DESIGN MUST BE IGNORED',
      embroideryDescription: 'GUIDED EMBROIDERY MUST BE IGNORED',
      completeRidaDescription: 'Ivory floral cloth with a standard coral panel and pearl lace.',
    }, { identityReferenceCount: 10 });
    assert.ok(descriptionPrompt.includes('literal whole-garment specification'));
    assert.ok(descriptionPrompt.includes('Ivory floral cloth with a standard coral panel and pearl lace.'));
    assert.ok(!descriptionPrompt.includes('GUIDED BASE MUST BE IGNORED'));
    assert.ok(!descriptionPrompt.includes('GUIDED DESIGN MUST BE IGNORED'));
    assert.ok(!descriptionPrompt.includes('GUIDED EMBROIDERY MUST BE IGNORED'));
    assert.ok(!descriptionPrompt.includes('not-a-real-guided'));
  });

  test('complete-rida photo is the highest-priority whole-garment reference', () => {
    const prompt = promptBuilder.buildPrompt({
      ...VALID_SELECTIONS,
      designMode: 'complete',
      completeRidaDescription: 'Use small silver floral accents.',
      completeRidaAnalysis: COMPLETE_ANALYSIS,
      completeRidaCorrection: 'Use the floral panel only on the ghaghro.',
      baseDescription: 'GUIDED BASE MUST BE IGNORED',
      designDescription: 'GUIDED DESIGN MUST BE IGNORED',
    }, {
      identityReferenceCount: 4,
      hasCompleteRidaReference: true,
      completeRidaReferenceIndex: 2,
      primaryIdentityReferenceIndex: 1,
      supportingIdentityStartIndex: 3,
    });
    assert.ok(prompt.includes('HIGHEST-PRIORITY GARMENT SOURCE'));
    assert.ok(prompt.includes('reference image 2 controls the entire generated garment'));
    assert.ok(prompt.includes('base-cloth colors, print, motif scale'));
    assert.ok(prompt.includes('panels, borders, lace, embroidery, embellishments'));
    assert.ok(prompt.includes("Ignore and never copy the source image's person, face, body"));
    assert.ok(prompt.includes('CONFIRMED COMPLETE-RIDA INTERPRETATION'));
    assert.ok(prompt.includes('exact top-to-bottom order'));
    assert.ok(prompt.includes('USER-REQUESTED CHANGE TO THE COMPLETE RIDA'));
    assert.ok(prompt.includes('precise delta'));
    assert.ok(prompt.includes('Use the floral panel only on the ghaghro'));
    assert.ok(prompt.includes('pose, or background'));
    assert.ok(prompt.includes('photo') && prompt.includes('visual specification'));
    assert.ok(prompt.includes('reference image 1 as the primary face-and-body reference'));
    assert.ok(prompt.includes('reference images 3 through 5 as supporting face-and-body views'));
    assert.ok(prompt.includes('image 2 is garment-only source material'));
    assert.ok(prompt.includes('Any person visible there is an unrelated sample model'));
    assert.ok(prompt.includes('Do not copy, preserve, blend, average, or transfer any human feature'));
    assert.ok(!prompt.includes('GUIDED BASE MUST BE IGNORED'));
    assert.ok(!prompt.includes('GUIDED DESIGN MUST BE IGNORED'));
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

  console.log('\n[4] Session (PIN login) and generation concurrency');

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

  test('generation guard allows repeated sequential generations without a daily cap', () => {
    const token = 'unlimited-generation-test-token';
    rateLimit._resetForTests();
    for (let i = 0; i < 25; i++) {
      const gate = rateLimit.beginGeneration(token);
      assert.strictEqual(gate.ok, true, `expected slot ${i} to be granted`);
      rateLimit.endGeneration(token);
    }
  });

  test('ending a failed generation releases the concurrency lock', () => {
    const token = 'generation-failure-token';
    rateLimit._resetForTests();
    const gate = rateLimit.beginGeneration(token);
    assert.strictEqual(gate.ok, true);
    rateLimit.endGeneration(token);
    assert.strictEqual(rateLimit.beginGeneration(token).ok, true);
    rateLimit.endGeneration(token);
  });

  test('concurrent generation attempts for the same session are rejected', () => {
    const token = 'concurrency-test-token';
    rateLimit._resetForTests();
    const first = rateLimit.beginGeneration(token);
    assert.strictEqual(first.ok, true);
    const second = rateLimit.beginGeneration(token);
    assert.strictEqual(second.ok, false);
    assert.strictEqual(second.reason, 'in_progress');
    rateLimit.endGeneration(token);
    const third = rateLimit.beginGeneration(token);
    assert.strictEqual(third.ok, true);
    rateLimit.endGeneration(token);
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

  await testAsync('shared OpenAI vision client sends a strict structured image request', async () => {
    const openaiVisionClient = require('../shared/openaiVisionClient');
    const guardedFetch = global.fetch;
    let capturedBody;
    global.fetch = async (input, init) => {
      capturedBody = JSON.parse(init.body);
      return new Response(JSON.stringify({
        output: [{
          content: [{
            type: 'output_text',
            text: JSON.stringify(COMPLETE_ANALYSIS),
          }],
        }],
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': 'fake-vision-request',
        },
      });
    };
    try {
      const result = await openaiVisionClient.analyzeImage({
        apiKey: 'sk-fake-test-key-not-real',
        imageBuffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
        mimeType: 'image/png',
        instructions: 'Synthetic structured analysis test.',
        schema: require('./referenceAnalyzer').ANALYSIS_SCHEMA,
      });
      assert.deepStrictEqual(result.analysis, COMPLETE_ANALYSIS);
      assert.strictEqual(result.requestId, 'fake-vision-request');
      assert.strictEqual(capturedBody.text.format.type, 'json_schema');
      assert.strictEqual(capturedBody.text.format.strict, true);
      assert.ok(capturedBody.input[0].content[1].image_url.startsWith('data:image/png;base64,'));
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
  const referenceAnalyzer = require('./referenceAnalyzer');
  const originalAnalyzeReference = referenceAnalyzer.analyzeReference;
  let lastAnalysisRole = null;
  referenceAnalyzer.analyzeReference = async ({ role }) => {
    lastAnalysisRole = role;
    await new Promise((resolve) => setTimeout(resolve, 30));
    const analysis = role === 'base_cloth'
      ? BASE_ANALYSIS
      : role === 'design'
        ? DESIGN_ANALYSIS
        : COMPLETE_ANALYSIS;
    return { model: 'fake-analysis-model', requestId: 'fake-analysis-id', analysis };
  };

  process.env.OPENAI_API_KEY = 'sk-fake-test-key-not-real';

  const router = require('./router');
  const app = express();
  app.use('/rida-studio/api', router.createRouter());
  const httpServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => httpServer.once('listening', resolve));
  const port = httpServer.address().port;
  const base = `http://127.0.0.1:${port}/rida-studio/api`;

  function extractCookie(res) {
    const raw = res.headers.get('set-cookie');
    if (!raw) return null;
    return raw.split(';')[0];
  }

  function analysisTokenFor(role, analysis, photoBase64 = TINY_PNG_BASE64) {
    const tokenValue = decodeURIComponent(sessionCookie.split('=')[1]);
    return analysisToken.createAnalysisToken({
      sessionToken: tokenValue,
      role,
      photoBuffer: Buffer.from(photoBase64, 'base64'),
      analysis,
    });
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

  await testAsync('GET /options with valid session cookie returns the full catalog', async () => {
    const res = await fetch(`${base}/options`, { headers: { Cookie: sessionCookie } });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.options.colors.length > 0);
    assert.strictEqual(Object.hasOwn(body, 'remaining'), false);
  });

  await testAsync('POST /analyze-reference returns a role-specific structured interpretation', async () => {
    const res = await fetch(`${base}/analyze-reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        role: 'design',
        photo: { mimeType: 'image/png', base64: TINY_PNG_BASE64 },
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(lastAnalysisRole, 'design');
    const body = await res.json();
    assert.deepStrictEqual(body.analysis, DESIGN_ANALYSIS);
    assert.strictEqual(typeof body.analysisToken, 'string');
    assert.strictEqual(res.headers.get('cache-control'), 'no-store');
  });

  await testAsync('POST /analyze-reference rejects invalid roles and image bytes', async () => {
    const badRole = await fetch(`${base}/analyze-reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        role: 'unknown',
        photo: { mimeType: 'image/png', base64: TINY_PNG_BASE64 },
      }),
    });
    assert.strictEqual(badRole.status, 400);
    const badImage = await fetch(`${base}/analyze-reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        role: 'complete',
        photo: {
          mimeType: 'image/png',
          base64: Buffer.from('not-a-png-image').toString('base64'),
        },
      }),
    });
    assert.strictEqual(badImage.status, 400);
  });

  await testAsync('POST /analyze-reference bounds concurrent paid requests per session', async () => {
    const request = (role) => fetch(`${base}/analyze-reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        role,
        photo: { mimeType: 'image/png', base64: TINY_PNG_BASE64 },
      }),
    });
    const sameRole = await Promise.all([request('complete'), request('complete')]);
    assert.deepStrictEqual(sameRole.map((res) => res.status).sort(), [200, 409]);
    const differentRoles = await Promise.all([request('base_cloth'), request('design')]);
    assert.deepStrictEqual(differentRoles.map((res) => res.status).sort(), [200, 200]);
  });

  test('reference-analysis guard also enforces a process-wide cap', () => {
    router._resetReferenceAnalysisLimitsForTests();
    assert.strictEqual(router.beginReferenceAnalysis('session-a', 'base_cloth'), true);
    assert.strictEqual(router.beginReferenceAnalysis('session-a', 'design'), true);
    assert.strictEqual(router.beginReferenceAnalysis('session-b', 'complete'), true);
    assert.strictEqual(router.beginReferenceAnalysis('session-c', 'base_cloth'), false);
    router._resetReferenceAnalysisLimitsForTests();
  });

  await testAsync('POST /generate rejects unknown option values (400)', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ ...VALID_SELECTIONS, color: 'not-real' }),
    });
    assert.strictEqual(res.status, 400);
  });

  await testAsync('POST /generate rejects an unknown design mode (400)', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ ...VALID_SELECTIONS, designMode: 'smart' }),
    });
    assert.strictEqual(res.status, 400);
  });

  await testAsync('POST /generate requires a complete-rida photo or description in complete mode', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        designMode: 'complete',
        style: 'storybook',
        location: 'parisCafe',
        completeRidaDescription: '   ',
      }),
    });
    assert.strictEqual(res.status, 400);
  });

  await testAsync('POST /generate rejects invalid complete-rida photo bytes', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        designMode: 'complete',
        style: 'storybook',
        location: 'parisCafe',
        completeRidaPhoto: {
          mimeType: 'image/png',
          base64: Buffer.from('not-a-png-image').toString('base64'),
        },
      }),
    });

    await testAsync('POST /generate requires structured analysis for uploaded references', async () => {
      const basePhoto = await fetch(`${base}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({
          ...VALID_SELECTIONS,
          baseClothPhoto: { mimeType: 'image/png', base64: TINY_PNG_BASE64 },
        }),
      });
      assert.strictEqual(basePhoto.status, 400);
      const completePhoto = await fetch(`${base}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({
          designMode: 'complete',
          style: 'storybook',
          location: 'parisCafe',
          completeRidaPhoto: { mimeType: 'image/png', base64: TINY_PNG_BASE64 },
        }),
      });
      assert.strictEqual(completePhoto.status, 400);
    });

    await testAsync('POST /generate rejects an analysis token replayed with different photo bytes', async () => {
      const changedPhoto = Buffer.concat([
        Buffer.from(TINY_PNG_BASE64, 'base64'),
        Buffer.from([0]),
      ]).toString('base64');
      const res = await fetch(`${base}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({
          designMode: 'complete',
          style: 'storybook',
          location: 'parisCafe',
          completeRidaPhoto: { mimeType: 'image/png', base64: changedPhoto },
          completeRidaAnalysisToken: analysisTokenFor('complete', COMPLETE_ANALYSIS),
        }),
      });
      assert.strictEqual(res.status, 400);
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

  await testAsync('POST /generate succeeds and returns one medium-quality image with no-store headers', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify(VALID_SELECTIONS),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('cache-control'), 'no-store');
    const body = await res.json();
    assert.strictEqual(body.images.length, 1);
    for (const img of body.images) assert.strictEqual(typeof img, 'string');
    assert.strictEqual(Object.hasOwn(body, 'remaining'), false);
    assert.strictEqual(lastFakeRequest.referenceBuffers.length, 10);
    assert.strictEqual(lastFakeRequest.n, 1);
    assert.strictEqual(lastFakeRequest.quality, 'medium');
  });

  await testAsync('POST /generate keeps identity first while prioritizing garment uploads', async () => {
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
        baseClothAnalysisToken: analysisTokenFor('base_cloth', BASE_ANALYSIS),
        designAnalysisToken: analysisTokenFor('design', DESIGN_ANALYSIS),
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(lastFakeRequest.referenceBuffers.length, 8);
    assert.strictEqual(lastFakeRequest.referenceBuffers[0].filename, 'synthetic-reference.png');
    assert.strictEqual(lastFakeRequest.referenceBuffers[1].filename, 'uploaded-base-cloth-photo.png');
    assert.strictEqual(lastFakeRequest.referenceBuffers[2].filename, 'uploaded-design-example-photo.png');
    assert.ok(lastFakeRequest.prompt.includes('reference image 2 controls'));
    assert.ok(lastFakeRequest.prompt.includes('reference image 3 is strictly the tailoring-design reference'));
    assert.ok(lastFakeRequest.prompt.includes('CONFIRMED BASE-CLOTH INTERPRETATION'));
    assert.ok(lastFakeRequest.prompt.includes('CONFIRMED DESIGN-ONLY INTERPRETATION'));
    assert.ok(lastFakeRequest.prompt.includes('reference image 1 as the primary face-and-body reference'));
    assert.ok(lastFakeRequest.prompt.includes('reference images 4 through 8 as supporting face-and-body views'));
    assert.ok(lastFakeRequest.prompt.includes('images 2, 3 are garment-only source material'));
  });

  await testAsync('POST /generate supports complete description without reducing identity references', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        designMode: 'complete',
        style: 'storybook',
        location: 'parisCafe',
        color: 'ignored-invalid-color',
        panel: 'ignored-invalid-panel',
        baseDescription: 'GUIDED BASE MUST BE IGNORED',
        designDescription: 'GUIDED DESIGN MUST BE IGNORED',
        completeRidaDescription: 'A literal teal-and-ivory whole rida with a 6-inch floral panel.',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(lastFakeRequest.referenceBuffers.length, 10);
    assert.ok(lastFakeRequest.prompt.includes('literal whole-garment specification'));
    assert.ok(lastFakeRequest.prompt.includes('A literal teal-and-ivory whole rida'));
    assert.ok(lastFakeRequest.prompt.includes('reference image 1 as the primary face-and-body reference'));
    assert.ok(lastFakeRequest.prompt.includes('reference images 2 through 10 as supporting face-and-body views'));
    assert.ok(!lastFakeRequest.prompt.includes('GUIDED BASE MUST BE IGNORED'));
    assert.ok(!lastFakeRequest.prompt.includes('GUIDED DESIGN MUST BE IGNORED'));
    assert.ok(lastFakeRequest.prompt.includes('standard panels at 6-8 inches'));
  });

  await testAsync('POST /generate puts Fatema first and complete-rida garment second', async () => {
    const res = await fetch(`${base}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        designMode: 'complete',
        style: 'storybook',
        location: 'parisCafe',
        completeRidaDescription: 'Preserve the complete photographed rida.',
        completeRidaPhoto: { mimeType: 'image/png', base64: TINY_PNG_BASE64 },
        completeRidaAnalysisToken: analysisTokenFor('complete', COMPLETE_ANALYSIS),
        baseClothPhoto: { mimeType: 'image/png', base64: 'invalid-guided-photo-is-ignored' },
        designPhoto: { mimeType: 'image/png', base64: 'invalid-guided-photo-is-ignored' },
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(lastFakeRequest.referenceBuffers.length, 7);
    assert.strictEqual(lastFakeRequest.referenceBuffers[0].filename, 'synthetic-reference.png');
    assert.strictEqual(lastFakeRequest.referenceBuffers[1].filename, 'uploaded-complete-rida-photo.png');
    assert.ok(lastFakeRequest.prompt.includes('reference image 2 controls the entire generated garment'));
    assert.ok(lastFakeRequest.prompt.includes('reference image 1 as the primary face-and-body reference'));
    assert.ok(lastFakeRequest.prompt.includes('reference images 3 through 7 as supporting face-and-body views'));
    assert.ok(lastFakeRequest.prompt.includes('image 2 is garment-only source material'));
    assert.ok(lastFakeRequest.prompt.includes('complete ordered stack separately'));
    assert.ok(lastFakeRequest.prompt.includes('floral panel remains a bounded lower panel'));
    assert.ok(!lastFakeRequest.prompt.includes('BASE-CLOTH SOURCE'));
    assert.ok(!lastFakeRequest.prompt.includes('tailoring-design reference'));
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

  await testAsync('logging out and back in keeps generation available', async () => {
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
    assert.strictEqual(Object.hasOwn(loginBody, 'remaining'), false);
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
  referenceAnalyzer.analyzeReference = originalAnalyzeReference;
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
