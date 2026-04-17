// engine.js — Board generation and game logic for Fatema Tiles

const ROWS = 6;
const COLS = 5;
const TILE_COUNT = ROWS * COLS; // 30

// ── Theme Definitions ──
// Each theme: palette (bg 3, ring 5, shape 3, accent 3), patterns/styles/shapes (5 each, 3 ring styles)
// Pool math: bg 5×3=15, ring 5×3=15, shape 5×3=15, accent 5×3=15

const THEMES = [
  {
    name: 'Azulejo', emoji: '🎨',
    palette: {
      bg:     ['#81C784', '#F48FB1', '#FFD54F'],
      ring:   ['#2E7D32', '#C2185B', '#1565C0', '#6A1B9A', '#E65100'],
      shape:  ['#43A047', '#E91E63', '#1E88E5'],
      accent: ['#FF6D00', '#00ACC1', '#AB47BC'],
    },
    bgPatterns:   ['checkerboard', 'diagonal', 'hBars', 'vBars', 'solid'],
    ringStyles:   ['solid', 'dashed', 'double'],
    shapeNames:   ['cross', 'flower', 'star', 'diamond', 'clover'],
    accentShapes: ['circles', 'diamonds', 'squares', 'triangles', 'dots'],
  },
  {
    name: 'Celestial', emoji: '🌙',
    palette: {
      bg:     ['#1a237e', '#4a148c', '#ff8f00'],
      ring:   ['#90a4ae', '#ffab00', '#00e5ff', '#e040fb', '#ff6e40'],
      shape:  ['#00e5ff', '#e040fb', '#ffab00'],
      accent: ['#b0bec5', '#00e5ff', '#ffd740'],
    },
    bgPatterns:   ['starfield', 'nebula', 'aurora', 'cosmic-dust', 'void'],
    ringStyles:   ['glow', 'dotted', 'eclipse'],
    shapeNames:   ['crescent', 'starburst', 'hexagon', 'saturn', 'eye'],
    accentShapes: ['tiny-stars', 'sparks', 'orbs', 'carets', 'moons'],
  },
  {
    name: 'Garden', emoji: '🌿',
    palette: {
      bg:     ['#66bb6a', '#ce93d8', '#fff176'],
      ring:   ['#2e7d32', '#7b1fa2', '#ef6c00', '#00838f', '#c62828'],
      shape:  ['#43a047', '#ab47bc', '#ff7043'],
      accent: ['#ff6f00', '#00897b', '#d81b60'],
    },
    bgPatterns:   ['polkadots', 'stripes', 'crosshatch', 'petals', 'meadow'],
    ringStyles:   ['vine', 'thorn', 'ribbon'],
    shapeNames:   ['heart', 'tulip', 'leaf', 'raindrop', 'sun'],
    accentShapes: ['seeds', 'dewdrops', 'buds', 'rosettes', 'thorns'],
  },
  {
    name: 'Deco', emoji: '✨',
    palette: {
      bg:     ['#ffd54f', '#80cbc4', '#ef9a9a'],
      ring:   ['#bf360c', '#1b5e20', '#4a148c', '#01579b', '#e65100'],
      shape:  ['#d84315', '#1b5e20', '#283593'],
      accent: ['#ff6f00', '#2e7d32', '#6a1b9a'],
    },
    bgPatterns:   ['fan', 'sunray', 'chevron', 'scales', 'zigzag'],
    ringStyles:   ['thick-thin', 'dotted-line', 'fillet'],
    shapeNames:   ['arch', 'bowtie', 'pentagon', 'keystone', 'fan-shape'],
    accentShapes: ['rays', 'studs', 'arrows', 'wings', 'bolts'],
  },
  {
    name: 'Mosaic', emoji: '🏺',
    palette: {
      bg:     ['#a1887f', '#80cbc4', '#ffe082'],
      ring:   ['#d84315', '#00695c', '#f9a825', '#283593', '#558b2f'],
      shape:  ['#bf360c', '#00897b', '#f57f17'],
      accent: ['#e65100', '#00838f', '#827717'],
    },
    bgPatterns:   ['triangles', 'hexgrid', 'brickwork', 'pinwheel', 'terrazzo'],
    ringStyles:   ['rope', 'notched', 'inset'],
    shapeNames:   ['octagon', 'arrow-shape', 'hourglass', 'shield', 'spiral'],
    accentShapes: ['plus-signs', 'arrowheads', 'wedges', 'pips', 'nails'],
  },
  {
    name: 'Candy', emoji: '🍬',
    palette: {
      bg:     ['#f48fb1', '#a5d6a7', '#ffe0b2'],
      ring:   ['#c2185b', '#00897b', '#ff6f00', '#6a1b9a', '#1565c0'],
      shape:  ['#e91e63', '#00bfa5', '#ff9100'],
      accent: ['#d81b60', '#00acc1', '#ff6d00'],
    },
    bgPatterns:   ['sprinkles', 'swirl', 'wafer', 'gingham', 'frosted'],
    ringStyles:   ['frosting', 'licorice', 'candy-dots'],
    shapeNames:   ['lollipop', 'gumdrop', 'pretzel', 'donut', 'bonbon'],
    accentShapes: ['mini-sprinkles', 'cherries', 'drops', 'gumballs', 'mini-hearts'],
  },
  {
    name: 'Noir', emoji: '🖤',
    palette: {
      bg:     ['#111111', '#333333', '#666666'],
      ring:   ['#ffffff', '#cccccc', '#888888', '#555555', '#aaaaaa'],
      shape:  ['#ffffff', '#999999', '#444444'],
      accent: ['#eeeeee', '#888888', '#333333'],
    },
    bgPatterns:   ['halftone', 'film-grain', 'scanlines', 'gradient-fade', 'ink-blot'],
    ringStyles:   ['sharp', 'etched', 'shadow'],
    shapeNames:   ['spade', 'crown', 'bolt-shape', 'mask', 'key'],
    accentShapes: ['crosshairs', 'slashes', 'corners', 'pins', 'xs'],
  },
  {
    name: 'Sepia', emoji: '📜',
    palette: {
      bg:     ['#f5e6d0', '#d4b896', '#a07850'],
      ring:   ['#3e2723', '#6b4423', '#8b6914', '#a0522d', '#5c3a1e'],
      shape:  ['#3e2723', '#8b6914', '#c49a6c'],
      accent: ['#5c3a1e', '#a0522d', '#d4a574'],
    },
    bgPatterns:   ['parchment', 'woodgrain', 'linen', 'coffee-stain', 'aged-paper'],
    ringStyles:   ['ornate', 'worn', 'gilded'],
    shapeNames:   ['quill', 'compass', 'anchor', 'fleur', 'lantern'],
    accentShapes: ['filigree', 'rivets', 'scrolls', 'stamps', 'ink-dots'],
  },
  {
    name: 'Neon', emoji: '💡',
    palette: {
      bg:     ['#0d0221', '#1a0533', '#2b0845'],
      ring:   ['#ff00ff', '#00ffff', '#ff3366', '#39ff14', '#ffff00'],
      shape:  ['#ff00ff', '#00ffff', '#39ff14'],
      accent: ['#ff3366', '#ffff00', '#00ffff'],
    },
    bgPatterns:   ['grid-lines', 'circuit', 'pixel-blocks', 'laser-beams', 'digital-rain'],
    ringStyles:   ['neon-glow', 'pulse', 'wireframe'],
    shapeNames:   ['lightning', 'pixel-heart', 'pac-ghost', 'controller', 'gem'],
    accentShapes: ['glitch-dots', 'brackets', 'pixels', 'signal-bars', 'power-icons'],
  },
  {
    name: 'Tropical', emoji: '🌴',
    palette: {
      bg:     ['#00bcd4', '#ff7043', '#ffee58'],
      ring:   ['#e91e63', '#4caf50', '#ff9800', '#2196f3', '#9c27b0'],
      shape:  ['#e91e63', '#4caf50', '#ff9800'],
      accent: ['#f44336', '#00bcd4', '#ffeb3b'],
    },
    bgPatterns:   ['waves', 'palm-fronds', 'sand-ripples', 'bamboo', 'sunset-gradient'],
    ringStyles:   ['lei', 'rope-twist', 'shell-border'],
    shapeNames:   ['flamingo', 'pineapple', 'hibiscus', 'surfboard', 'starfish'],
    accentShapes: ['coconuts', 'fish', 'waves-mini', 'shells', 'sun-rays'],
  },
  {
    name: 'Indian', emoji: '🪷',
    palette: {
      bg:     ['#ff9933', '#138808', '#4a0082'],
      ring:   ['#d4af37', '#b22222', '#ff6f00', '#1a5276', '#8b0000'],
      shape:  ['#d4af37', '#b22222', '#138808'],
      accent: ['#ff9933', '#d4af37', '#e91e63'],
    },
    bgPatterns:   ['rangoli', 'paisley', 'mehndi-swirls', 'block-print', 'jali-lattice'],
    ringStyles:   ['zari-border', 'kolam', 'thread-wrap'],
    shapeNames:   ['diya', 'lotus', 'elephant', 'peacock', 'mango-paisley'],
    accentShapes: ['bindis', 'bells', 'bangles', 'om-dots', 'marigolds'],
  },
  {
    name: 'Bollywood', emoji: '🎬',
    palette: {
      bg:     ['#e91e63', '#ffd700', '#6a1b9a'],
      ring:   ['#ff4081', '#ffc107', '#00bcd4', '#e040fb', '#ff5722'],
      shape:  ['#ff4081', '#ffd700', '#00bcd4'],
      accent: ['#e040fb', '#ff5722', '#ffc107'],
    },
    bgPatterns:   ['spotlight', 'sequins', 'film-strip', 'curtain-drapes', 'disco-floor'],
    ringStyles:   ['marquee-lights', 'bollywood-arch', 'sequin-border'],
    shapeNames:   ['star', 'filmi-heart', 'microphone', 'clapperboard', 'dancing-figure'],
    accentShapes: ['music-notes', 'sparkles', 'cameras', 'roses', 'masala-stars'],
  },
];

// Build 4 independent pools of 15 attributes each (total 60, ids 0-59)
function buildPools(theme) {
  let id = 0;
  const p = theme.palette;

  const bg = [];
  for (const pattern of theme.bgPatterns) {
    for (const color of p.bg) {
      bg.push({ id: id++, type: 'bg', color, pattern });
    }
  }

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

  return { bg, ring, shape, accent };
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

  const tiles = Array.from({ length: TILE_COUNT }, (_, i) => ({
    index: i,
    row: Math.floor(i / COLS),
    col: i % COLS,
    attributes: new Map(),
    cleared: false,
  }));

  // For each type independently: duplicate 15 → 30, shuffle, assign to tiles
  for (const typePool of [pools.bg, pools.ring, pools.shape, pools.accent]) {
    const paired = [...typePool, ...typePool]; // each attr appears exactly twice
    shuffle(paired);
    for (let i = 0; i < TILE_COUNT; i++) {
      const attr = paired[i];
      tiles[i].attributes.set(attr.id, { ...attr });
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
    this.totalTiles = TILE_COUNT;
    this.moveCount = 0;
  }

  newGame() {
    this.board = generateBoard();
    this.currentTheme = this.board.theme;
    this.selectedTile = null;
    this.currentCombo = 0;
    this.longestCombo = 0;
    this.tilesCleared = 0;
    this.totalTiles = TILE_COUNT;
    this.moveCount = 0;
    return this.board;
  }

  selectTile(index) {
    const tile = this.board.tiles[index];
    if (!tile || tile.cleared || tile.attributes.size === 0) return { action: 'invalid' };

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
    const activeTiles = this.board.tiles.filter(t => !t.cleared && t.attributes.size > 0);
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

export { GameState, ROWS, COLS, TILE_COUNT, THEMES };
