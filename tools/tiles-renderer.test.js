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
const renderer = load('renderer.js', ['createTileSVG', 'createCenterHeartSVG', 'renderBg'], {
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

test('named center keepsakes are opt-in and retain the original monogram', () => {
  const theme = engine.THEMES.find(item => item.showCoupleNames);
  assert.ok(theme);
  const named = renderer.createCenterHeartSVG(theme).innerHTML;
  assert.match(named, />Husein<\/text>/);
  assert.match(named, />Fatema<\/text>/);
  assert.match(named, /class="center-heart"/);
  const legacy = renderer.createCenterHeartSVG({ ...theme, showCoupleNames: false }).innerHTML;
  assert.doesNotMatch(legacy, /Husein|Fatema/);
  assert.match(legacy, /class="center-heart"/);
});

test('every active theme can be matched through to a complete photo reveal', () => {
  const { THEMES, GameState } = load('engine.js', ['THEMES', 'GameState'], {
    Date: class extends Date {
      constructor(...args) {
        super(...(args.length ? args : ['2026-11-11T12:00:00Z']));
      }
    },
  });
  const themes = [...THEMES];
  for (const theme of themes) {
    THEMES.splice(0, THEMES.length, theme);
    for (let attempt = 0; attempt < 3; attempt++) {
      const game = new GameState();
      const board = game.newGame();
      assert.equal(board.theme.name, theme.name);
      assert.equal(board.tiles.filter(tile => tile.isCenter).length, 1);
      assert.equal(game.selectTile(12).action, 'invalid');
      let won = false;
      while (!won && game.moveCount < 36) {
        if (game.selectedTile !== null) game.selectTile(game.selectedTile);
        const first = board.tiles.find(tile => !tile.isCenter && tile.attributes.size);
        assert.ok(first, `${theme.name}: no selectable tile before win`);
        const second = board.tiles.find(tile =>
          tile !== first && [...first.attributes.keys()].some(id => tile.attributes.has(id))
        );
        assert.ok(second, `${theme.name}: orphaned match`);
        assert.equal(game.selectTile(first.index).action, 'selected');
        const result = game.selectTile(second.index);
        assert.equal(result.action, 'match');
        won = result.isWin;
      }
      assert.ok(won, `${theme.name}: board must finish within 36 attribute pairs`);
      assert.equal(game.tilesCleared, 24);
      assert.ok(board.tiles.every(tile => tile.attributes.size === 0));
      game.newGame();
      assert.equal(game.tilesCleared, 0);
      assert.equal(game.currentCombo, 0);
      assert.equal(game.selectedTile, null);
    }
  }
});
