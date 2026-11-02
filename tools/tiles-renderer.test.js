const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const tilesDir = path.join(__dirname, '..', 'public', 'tiles');
const load = (file, names, globals = {}) => {
  const source = fs.readFileSync(path.join(tilesDir, file), 'utf8')
    .replace(/^import .+;$/gm, '')
    .replace(/export\s*\{[^}]*\};?/g, '');
  return vm.runInNewContext(`${source}\n;({ ${names.join(', ')} });`, globals);
};
const engine = load('engine.js', ['THEMES', 'BIRTHDAY_THEMES', 'buildPools']);
const renderer = load('renderer.js', ['createTileSVG', 'renderBg'], {
  document: {
    createElementNS() {
      return { setAttribute() {}, innerHTML: '' };
    },
  },
});
const markup = (theme, attributes, bgColor = theme.palette.bg[0]) =>
  renderer.createTileSVG({
    index: 0,
    bgColor,
    attributes: new Map(attributes.map(attr => [attr.id, attr])),
  }, theme).innerHTML;

test('soft illustration adds breathing room without changing legacy high-contrast sizing', () => {
  const theme = engine.THEMES.find(item => item.softIllustration);
  assert.ok(theme, 'A soft illustration theme is required for this regression test');
  const pools = engine.buildPools(theme);
  const softShape = markup(theme, [pools.shape[0]]);
  const softRing = markup(theme, [pools.ring[0]]);
  const softAccent = markup(theme, [pools.accent[0]]);
  assert.match(softShape, /translate\(50 50\) scale\(1\) translate\(-50 -50\)/);
  assert.match(softRing, /translate\(50 50\) scale\(1\) translate\(-50 -50\)/);
  assert.match(softAccent, /translate\(16 16\) scale\(1\.25\) translate\(-16 -16\)/);

  const legacy = { ...theme, softIllustration: false };
  assert.match(markup(legacy, [pools.shape[0]]), /scale\(1\.15\)/);
  assert.match(markup(legacy, [pools.ring[0]]), /scale\(0\.92\)/);
  assert.match(markup(legacy, [pools.accent[0]]), /scale\(1\.6\)/);
});

test('every active and scheduled foreground renders on all three backgrounds', () => {
  for (const theme of [...engine.THEMES, ...engine.BIRTHDAY_THEMES]) {
    const pools = engine.buildPools(theme);
    for (const attributes of Object.values(pools)) {
      const distinct = new Set();
      for (const attr of attributes) {
        for (const bgColor of theme.palette.bg) {
          const svg = markup(theme, [attr], bgColor);
          assert.doesNotMatch(svg, /undefined|NaN|Infinity/, `${theme.name}: ${attr.type}`);
          assert.match(svg, /<rect[^>]*fill="white"/, `${theme.name}: opaque photo backing`);
          const layer = svg.slice(svg.indexOf('<g class="attr-layer"'));
          assert.match(layer, /<(?:path|rect|circle|ellipse|polygon|line)\b/, `${theme.name}: blank ${attr.type}`);
          if (theme.softIllustration) {
            assert.doesNotMatch(layer, /#172033|paint-order="stroke"/, `${theme.name}: sticker styling`);
          }
          if (bgColor === theme.palette.bg[0]) distinct.add(layer);
        }
      }
      assert.equal(distinct.size, 12, `${theme.name}: visually duplicated attribute variants`);
    }
    for (const pattern of theme.bgPatterns) {
      const svg = renderer.renderBg({ pattern, color: theme.boardBg.color });
      assert.match(svg, /<(?:path|rect|line)\b/, `${theme.name}: blank background ${pattern}`);
    }
  }
});

test('every current motif has its own guide explanation', () => {
  const { GUIDES } = load('theme-guide.js', ['GUIDES']);
  for (const theme of engine.THEMES) {
    const guide = GUIDES[theme.name];
    assert.ok(guide?.intro && guide.background, `${theme.name}: missing theme introduction`);
    const identifiers = [...theme.shapeNames, ...theme.ringStyles, ...theme.accentShapes];
    for (const identifier of identifiers) {
      const entry = guide.elements[identifier];
      assert.ok(entry?.[0] && entry[1], `${theme.name}: unexplained motif ${identifier}`);
    }
    assert.deepEqual(Object.keys(guide.elements).sort(), [...identifiers].sort(), `${theme.name}: stale guide motif`);
  }
});
