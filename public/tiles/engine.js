// engine.js — Board generation and game logic for Fatema Tiles

const ROWS = 5;
const COLS = 5;
const TILE_COUNT = ROWS * COLS; // 25
const ACTIVE_TILES = 24;        // center tile is decorative
const CENTER_INDEX = 12;         // position [2,2] in 5x5 grid

// ── Theme Definitions ──
// Each theme: palette (bg 3, ring 4, shape 3, accent 3), bgPatterns 5, ringStyles 3, shapeNames 4, accentShapes 4
// Pool math: ring 4×3=12, shape 4×3=12, accent 4×3=12 (bg is board-level only, not matchable)

const THEMES = [
  {
    name: 'Azulejo', emoji: '🎨',
    palette: {
      bg:     ['#66BB6A', '#F06292', '#FFB300'],
      ring:   ['#2E7D32', '#C2185B', '#1565C0', '#6A1B9A'],
      shape:  ['#43A047', '#E91E63', '#1E88E5'],
      accent: ['#FF6D00', '#00ACC1', '#AB47BC'],
    },
    bgPatterns:   ['checkerboard', 'diagonal', 'hBars', 'vBars', 'solid'],
    ringStyles:   ['solid', 'dashed', 'double'],
    shapeNames:   ['cross', 'flower', 'star', 'diamond'],
    accentShapes: ['circles', 'diamonds', 'squares', 'triangles'],
    boardBg: { pattern: 'checkerboard', color: '#66BB6A' },
  },

  {
    name: 'Mosaic', emoji: '🏺',
    palette: {
      bg:     ['#8d6e63', '#4db6ac', '#ffb74d'],
      ring:   ['#d84315', '#00695c', '#f9a825', '#283593'],
      shape:  ['#bf360c', '#00897b', '#f57f17'],
      accent: ['#e65100', '#00838f', '#827717'],
    },
    bgPatterns:   ['triangles', 'hexgrid', 'brickwork', 'pinwheel', 'terrazzo'],
    ringStyles:   ['rope', 'notched', 'inset'],
    shapeNames:   ['octagon', 'arrow-shape', 'hourglass', 'shield'],
    accentShapes: ['plus-signs', 'arrowheads', 'wedges', 'pips'],
    boardBg: { pattern: 'solid', color: '#8d6e63' },
  },
  {
    name: 'Candy', emoji: '🍬',
    palette: {
      bg:     ['#f06292', '#81c784', '#ffcc80'],
      ring:   ['#c2185b', '#00897b', '#ff6f00', '#6a1b9a'],
      shape:  ['#e91e63', '#00bfa5', '#ff9100'],
      accent: ['#d81b60', '#00acc1', '#ff6d00'],
    },
    bgPatterns:   ['sprinkles', 'swirl', 'wafer', 'gingham', 'frosted'],
    ringStyles:   ['frosting', 'licorice', 'candy-dots'],
    shapeNames:   ['lollipop', 'gumdrop', 'pretzel', 'donut'],
    accentShapes: ['mini-sprinkles', 'cherries', 'drops', 'gumballs'],
    boardBg: { pattern: 'gingham', color: '#f06292' },
  },
  {
    name: 'Tropical', emoji: '🌴',
    palette: {
      bg:     ['#00bcd4', '#ff7043', '#ffca28'],
      ring:   ['#e91e63', '#4caf50', '#ff9800', '#2196f3'],
      shape:  ['#e91e63', '#4caf50', '#ff9800'],
      accent: ['#f44336', '#00bcd4', '#e65100'],
    },
    bgPatterns:   ['waves', 'palm-fronds', 'sand-ripples', 'bamboo', 'sunset-gradient'],
    ringStyles:   ['lei', 'rope-twist', 'shell-border'],
    shapeNames:   ['flamingo', 'pineapple', 'hibiscus', 'surfboard'],
    accentShapes: ['coconuts', 'fish', 'waves-mini', 'shells'],
    boardBg: { pattern: 'waves', color: '#00bcd4' },
  },

  {
    name: 'Arithmetic', emoji: '🔢',
    palette: {
      bg:     ['#2e7d32', '#fff8e1', '#5d4037'],
      ring:   ['#1a237e', '#e65100', '#ff7043', '#42a5f5'],
      shape:  ['#1a237e', '#e65100', '#42a5f5'],
      accent: ['#ff7043', '#ef5350', '#1a237e'],
    },
    bgPatterns:   ['graph-paper', 'chalkboard', 'notebook-lines', 'dot-grid', 'equation-scribbles'],
    ringStyles:   ['ruler-marks', 'protractor', 'bracket-border'],
    shapeNames:   ['plus-sign', 'divide-symbol', 'pi-symbol', 'infinity'],
    accentShapes: ['equal-signs', 'percent', 'tally-marks', 'decimal-dots'],
    boardBg: { pattern: 'chalkboard', color: '#2e7d32' },
  },
  {
    name: 'Sky', emoji: '🌈',
    palette: {
      bg:     ['#64b5f6', '#90caf9', '#fff176'],
      ring:   ['#e53935', '#ff9800', '#4caf50', '#7b1fa2'],
      shape:  ['#e53935', '#ff9800', '#1565c0'],
      accent: ['#4caf50', '#f48fb1', '#ffb300'],
    },
    bgPatterns:   ['sky-gradient', 'fluffy-clouds', 'rainbow-arc', 'cirrus-wisps', 'sunset-glow'],
    ringStyles:   ['cloud-border', 'rainbow-ring', 'breeze-dash'],
    shapeNames:   ['airplane', 'songbird', 'bright-sun', 'kite'],
    accentShapes: ['tiny-birds', 'butterflies', 'raindrops', 'drifting-leaves'],
    boardBg: { pattern: 'sky-gradient', color: '#64b5f6' },
  },
  {
    name: 'Bollywood', emoji: '🎬',
    palette: {
      bg:     ['#e91e63', '#ffd700', '#6a1b9a'],
      ring:   ['#ff4081', '#ffc107', '#00bcd4', '#e040fb'],
      shape:  ['#ff4081', '#ffd700', '#00bcd4'],
      accent: ['#e040fb', '#ff5722', '#ffc107'],
    },
    bgPatterns:   ['spotlight', 'sequins', 'film-strip', 'curtain-drapes', 'disco-floor'],
    ringStyles:   ['marquee-lights', 'bollywood-arch', 'sequin-border'],
    shapeNames:   ['filmi-star', 'filmi-heart', 'microphone', 'clapperboard'],
    accentShapes: ['music-notes', 'sparkles', 'cameras', 'roses'],
    boardBg: { pattern: 'solid', color: '#e91e63' },
  },
  {
    name: 'Arctic', emoji: '❄️',
    palette: {
      bg:     ['#1565c0', '#e1f5fe', '#b39ddb'],
      ring:   ['#0d47a1', '#00838f', '#6a1b9a', '#1b5e20'],
      shape:  ['#0d47a1', '#c62828', '#1b5e20'],
      accent: ['#0d47a1', '#4a148c', '#00695c'],
    },
    bgPatterns:   ['ice-crystals', 'snowfall', 'frozen-lake', 'blizzard-wind', 'glacier-layers'],
    ringStyles:   ['frost-border', 'icicle-ring', 'snowdrift-edge'],
    shapeNames:   ['snowflake', 'penguin', 'igloo', 'polar-bear'],
    accentShapes: ['ice-shards', 'snowflakes-tiny', 'frost-dots', 'icicle-drops'],
    boardBg: { pattern: 'ice-crystals', color: '#1565c0' },
  },
  {
    name: 'Apps', emoji: '📱',
    palette: {
      bg:     ['#42a5f5', '#66bb6a', '#ffa726'],
      ring:   ['#1a237e', '#1b5e20', '#b71c1c', '#4a148c'],
      shape:  ['#004d40', '#4e342e', '#263238'],
      accent: ['#bf360c', '#006064', '#880e4f'],
    },
    bgPatterns:   ['app-grid', 'status-bar', 'home-screen', 'swipe-trail', 'notification-shade'],
    ringStyles:   ['app-border', 'rounded-badge', 'pill-outline'],
    shapeNames:   ['chat-bubble', 'wifi-icon', 'battery-shape', 'bell-icon'],
    accentShapes: ['app-dot', 'signal-bars-corner', 'toggle-switch', 'pin-badge'],
    boardBg: { pattern: 'solid', color: '#42a5f5' },
  },
  {
    name: 'Laundry', emoji: '🧺',
    palette: {
      bg:     ['#b39ddb', '#81d4fa', '#a5d6a7'],
      ring:   ['#0d47a1', '#004d40', '#4a148c', '#3e2723'],
      shape:  ['#1a237e', '#006064', '#4e342e'],
      accent: ['#311b92', '#01579b', '#33691e'],
    },
    bgPatterns:   ['clothesline', 'fabric-weave', 'tumble-dry', 'soap-suds', 'laundry-basket'],
    ringStyles:   ['stitched', 'hemline', 'fold-crease'],
    shapeNames:   ['sock-shape', 'hanger', 'clothespin', 'iron-shape'],
    accentShapes: ['buttons', 'safety-pins', 'lint-balls', 'thread-spools'],
    boardBg: { pattern: 'solid', color: '#b39ddb' },
  },
  {
    name: 'Jeweler', emoji: '💎',
    palette: {
      bg:     ['#ef5350', '#42a5f5', '#66bb6a'],
      ring:   ['#6d4c00', '#0d47a1', '#1b5e20', '#4a148c'],
      shape:  ['#880e4f', '#004d40', '#311b92'],
      accent: ['#3e2723', '#01579b', '#33691e'],
    },
    bgPatterns:   ['velvet-cushion', 'display-case', 'chain-links', 'gem-facets', 'jewel-box'],
    ringStyles:   ['band-ring', 'prong-setting', 'filigree-band'],
    shapeNames:   ['diamond-gem', 'pearl-drop', 'watch-face', 'tiara'],
    accentShapes: ['gem-studs', 'clasp-hooks', 'sparkle-dots', 'tiny-gems'],
    boardBg: { pattern: 'velvet-cushion', color: '#2c1810' },
  },
  {
    name: 'Royal Court', emoji: '👑',
    palette: {
      bg:     ['#9c27b0', '#1565c0', '#c62828'],
      ring:   ['#6d4c00', '#311b92', '#7f0000', '#0d47a1'],
      shape:  ['#4a148c', '#1a237e', '#3e2723'],
      accent: ['#263238', '#880e4f', '#33691e'],
    },
    bgPatterns:   ['royal-damask', 'throne-room', 'castle-stone', 'tapestry-weave', 'herald-banner'],
    ringStyles:   ['crown-points', 'royal-chain', 'ermine-trim'],
    shapeNames:   ['royal-crown', 'scepter', 'throne-shape', 'royal-shield'],
    accentShapes: ['fleur-marks', 'royal-orbs', 'crown-jewels', 'crest-corners'],
    boardBg: { pattern: 'royal-damask', color: '#311b92' },
  },
];

// Archived themes — preserved for reference, not selectable in-game
const ARCHIVED_THEMES = [
  {
    name: 'Noir', emoji: '🖤',
    palette: {
      bg:     ['#111111', '#333333', '#666666'],
      ring:   ['#222222', '#444444', '#777777', '#555555'],
      shape:  ['#222222', '#666666', '#444444'],
      accent: ['#222222', '#666666', '#333333'],
    },
    bgPatterns:   ['halftone', 'film-grain', 'scanlines', 'gradient-fade', 'ink-blot'],
    ringStyles:   ['sharp', 'etched', 'shadow'],
    shapeNames:   ['spade', 'crown', 'bolt-shape', 'mask'],
    accentShapes: ['crosshairs', 'slashes', 'corners', 'pins'],
    boardBg: { pattern: 'solid', color: '#111111' },
  },
  {
    name: 'Sepia', emoji: '📜',
    palette: {
      bg:     ['#d4c4a8', '#c0a080', '#a07850'],
      ring:   ['#3e2723', '#6b4423', '#8b6914', '#a0522d'],
      shape:  ['#3e2723', '#8b6914', '#795548'],
      accent: ['#5c3a1e', '#a0522d', '#6d4c41'],
    },
    bgPatterns:   ['parchment', 'woodgrain', 'linen', 'coffee-stain', 'aged-paper'],
    ringStyles:   ['ornate', 'worn', 'gilded'],
    shapeNames:   ['quill', 'compass', 'anchor', 'fleur'],
    accentShapes: ['filigree', 'rivets', 'scrolls', 'stamps'],
    boardBg: { pattern: 'parchment', color: '#d4c4a8' },
  },
  {
    name: 'Neon', emoji: '💡',
    palette: {
      bg:     ['#0d0221', '#1a0533', '#2b0845'],
      ring:   ['#ff00ff', '#00ffff', '#ff3366', '#39ff14'],
      shape:  ['#ff00ff', '#00ffff', '#39ff14'],
      accent: ['#ff3366', '#ff6d00', '#00ffff'],
    },
    bgPatterns:   ['grid-lines', 'circuit', 'pixel-blocks', 'laser-beams', 'digital-rain'],
    ringStyles:   ['neon-glow', 'pulse', 'wireframe'],
    shapeNames:   ['lightning', 'pixel-heart', 'pac-ghost', 'controller'],
    accentShapes: ['glitch-dots', 'brackets', 'pixels', 'signal-bars'],
    boardBg: { pattern: 'grid-lines', color: '#0d0221' },
  },
  {
    name: 'Celestial', emoji: '🌙',
    palette: {
      bg:     ['#1a237e', '#4a148c', '#ff8f00'],
      ring:   ['#455a64', '#ffab00', '#00838f', '#e040fb'],
      shape:  ['#00838f', '#e040fb', '#ffab00'],
      accent: ['#5c6bc0', '#00838f', '#e65100'],
    },
    bgPatterns:   ['starfield', 'nebula', 'aurora', 'cosmic-dust', 'void'],
    ringStyles:   ['glow', 'dotted', 'eclipse'],
    shapeNames:   ['crescent', 'starburst', 'hexagon', 'saturn'],
    accentShapes: ['tiny-stars', 'sparks', 'orbs', 'carets'],
    boardBg: { pattern: 'solid', color: '#1a237e' },
  },
  {
    name: 'Garden', emoji: '🌿',
    palette: {
      bg:     ['#4caf50', '#ba68c8', '#fbc02d'],
      ring:   ['#2e7d32', '#7b1fa2', '#ef6c00', '#00838f'],
      shape:  ['#43a047', '#ab47bc', '#ff7043'],
      accent: ['#ff6f00', '#00897b', '#d81b60'],
    },
    bgPatterns:   ['polkadots', 'stripes', 'crosshatch', 'petals', 'meadow'],
    ringStyles:   ['vine', 'thorn', 'ribbon'],
    shapeNames:   ['heart', 'tulip', 'leaf', 'raindrop'],
    accentShapes: ['seeds', 'dewdrops', 'buds', 'rosettes'],
    boardBg: { pattern: 'solid', color: '#4caf50' },
  },
  {
    name: 'Deco', emoji: '✨',
    palette: {
      bg:     ['#ffb300', '#4db6ac', '#e57373'],
      ring:   ['#bf360c', '#1b5e20', '#4a148c', '#01579b'],
      shape:  ['#d84315', '#1b5e20', '#283593'],
      accent: ['#ff6f00', '#2e7d32', '#6a1b9a'],
    },
    bgPatterns:   ['fan', 'sunray', 'chevron', 'scales', 'zigzag'],
    ringStyles:   ['thick-thin', 'dotted-line', 'fillet'],
    shapeNames:   ['arch', 'bowtie', 'pentagon', 'keystone'],
    accentShapes: ['rays', 'studs', 'arrows', 'wings'],
    boardBg: { pattern: 'solid', color: '#ffb300' },
  },
  {
    name: 'Indian', emoji: '🪷',
    palette: {
      bg:     ['#ff9933', '#138808', '#4a0082'],
      ring:   ['#d4af37', '#b22222', '#ff6f00', '#1a5276'],
      shape:  ['#d4af37', '#b22222', '#138808'],
      accent: ['#ff9933', '#d4af37', '#e91e63'],
    },
    bgPatterns:   ['rangoli', 'paisley', 'mehndi-swirls', 'block-print', 'jali-lattice'],
    ringStyles:   ['zari-border', 'kolam', 'thread-wrap'],
    shapeNames:   ['diya', 'lotus', 'elephant', 'peacock'],
    accentShapes: ['bindis', 'bells', 'bangles', 'om-dots'],
    boardBg: { pattern: 'solid', color: '#ff9933' },
  },
  {
    name: 'Street Food', emoji: '🍕',
    palette: {
      bg:     ['#d84315', '#f9a825', '#2e7d32'],
      ring:   ['#bf360c', '#f57f17', '#1b5e20', '#4e342e'],
      shape:  ['#f57f17', '#1b5e20', '#bf360c'],
      accent: ['#4e342e', '#1b5e20', '#ff6e40'],
    },
    bgPatterns:   ['checkered-tablecloth', 'food-truck-stripe', 'brick-wall', 'napkin-fold', 'grease-paper'],
    ringStyles:   ['pretzel-twist', 'sauce-drizzle', 'chopstick-border'],
    shapeNames:   ['pizza-slice', 'taco', 'boba-cup', 'soft-pretzel'],
    accentShapes: ['sesame-seeds', 'chili-flakes', 'crumbs', 'steam-wisps'],
    boardBg: { pattern: 'checkered-tablecloth', color: '#d84315' },
  },
];

// Build 3 independent pools of 12 attributes each (total 36, ids 0-35)
function buildPools(theme) {
  let id = 0;
  const p = theme.palette;

  const ring = [];
  for (const color of p.ring) {
    for (const style of theme.ringStyles) {
      ring.push({ id: id++, type: 'ring', color, style });
    }
  }

  const shape = [];
  for (const shapeName of theme.shapeNames) {
    for (const color of p.shape) {
      shape.push({ id: id++, type: 'shape', color, shape: shapeName });
    }
  }

  const accent = [];
  for (const accentShape of theme.accentShapes) {
    for (const color of p.accent) {
      accent.push({ id: id++, type: 'accent', color, accentShape });
    }
  }

  return { ring, shape, accent };
}

// Shuffle array in-place (Fisher-Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate board: per-type pair-and-shuffle guarantees solvability by construction
function generateBoard() {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const pools = buildPools(theme);

  const bgColors = theme.palette.bg;
  const tiles = Array.from({ length: TILE_COUNT }, (_, i) => ({
    index: i,
    row: Math.floor(i / COLS),
    col: i % COLS,
    attributes: new Map(),
    cleared: i === CENTER_INDEX,
    isCenter: i === CENTER_INDEX,
    bgColor: bgColors[Math.floor(Math.random() * bgColors.length)],
  }));

  // Collect active tile indices (excluding center)
  const activeIndices = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    if (i !== CENTER_INDEX) activeIndices.push(i);
  }

  // For each type independently: duplicate 12 → 24, shuffle, assign to active tiles
  for (const typePool of [pools.ring, pools.shape, pools.accent]) {
    const paired = [...typePool, ...typePool]; // each attr appears exactly twice
    shuffle(paired);
    for (let i = 0; i < ACTIVE_TILES; i++) {
      const attr = paired[i];
      tiles[activeIndices[i]].attributes.set(attr.id, { ...attr });
    }
  }

  return { tiles, rows: ROWS, cols: COLS, theme };
}

// Game state management
class GameState {
  constructor() {
    this.board = null;
    this.currentTheme = null;
    this.selectedTile = null;
    this.currentCombo = 0;
    this.longestCombo = 0;
    this.tilesCleared = 0;
    this.totalTiles = ACTIVE_TILES;
    this.moveCount = 0;
  }

  newGame() {
    this.board = generateBoard();
    this.currentTheme = this.board.theme;
    this.selectedTile = null;
    this.currentCombo = 0;
    this.longestCombo = 0;
    this.tilesCleared = 0;
    this.totalTiles = ACTIVE_TILES;
    this.moveCount = 0;
    return this.board;
  }

  selectTile(index) {
    const tile = this.board.tiles[index];
    if (!tile || tile.cleared || tile.isCenter || tile.attributes.size === 0) return { action: 'invalid' };

    if (this.selectedTile === null) {
      // First selection
      this.selectedTile = index;
      return { action: 'selected', tileIndex: index };
    }

    if (this.selectedTile === index) {
      // Deselect
      this.selectedTile = null;
      return { action: 'deselected', tileIndex: index };
    }

    // Second selection — attempt match
    const tile1 = this.board.tiles[this.selectedTile];
    const tile2 = tile;
    const firstIndex = this.selectedTile;
    this.selectedTile = null;

    // Find shared attributes
    const shared = [];
    for (const [id] of tile1.attributes) {
      if (tile2.attributes.has(id)) {
        shared.push(id);
      }
    }

    if (shared.length === 0) {
      // No match — break combo
      this.currentCombo = 0;
      return {
        action: 'no-match',
        tile1Index: firstIndex,
        tile2Index: index,
      };
    }

    // Match found — remove shared attributes from both tiles
    this.moveCount++;
    this.currentCombo++;
    if (this.currentCombo > this.longestCombo) {
      this.longestCombo = this.currentCombo;
    }

    const removedFromTile1 = [];
    const removedFromTile2 = [];

    for (const id of shared) {
      removedFromTile1.push(tile1.attributes.get(id));
      removedFromTile2.push(tile2.attributes.get(id));
      tile1.attributes.delete(id);
      tile2.attributes.delete(id);
    }

    // Check if tiles are now cleared
    const tile1Cleared = tile1.attributes.size === 0;
    const tile2Cleared = tile2.attributes.size === 0;

    if (tile1Cleared) {
      tile1.cleared = true;
      this.tilesCleared++;
    }
    if (tile2Cleared) {
      tile2.cleared = true;
      this.tilesCleared++;
    }

    // Streak mechanic: tile2 stays selected if it still has attributes
    if (!tile2Cleared) {
      this.selectedTile = index;
    }

    const isWin = this.tilesCleared === this.totalTiles;

    return {
      action: 'match',
      tile1Index: firstIndex,
      tile2Index: index,
      shared,
      removedFromTile1,
      removedFromTile2,
      tile1Cleared,
      tile2Cleared,
      currentCombo: this.currentCombo,
      longestCombo: this.longestCombo,
      tilesCleared: this.tilesCleared,
      totalTiles: this.totalTiles,
      isWin,
    };
  }

  // Check if any valid moves remain
  hasValidMoves() {
    const activeTiles = this.board.tiles.filter(t => !t.cleared && !t.isCenter && t.attributes.size > 0);
    for (let i = 0; i < activeTiles.length; i++) {
      for (let j = i + 1; j < activeTiles.length; j++) {
        for (const [id] of activeTiles[i].attributes) {
          if (activeTiles[j].attributes.has(id)) {
            return true;
          }
        }
      }
    }
    return false;
  }

}

export { GameState, ROWS, COLS, TILE_COUNT, ACTIVE_TILES, CENTER_INDEX, THEMES };
