// engine.js — Board generation and game logic for Fatema Tiles

const ROWS = 6;
const COLS = 5;
const TILE_COUNT = ROWS * COLS; // 30

// Color palette — per-zone colors for the azulejo spatial design
const PALETTE = {
  bg:     ['#81C784', '#F48FB1', '#FFD54F'],                          // Medium green, pink, gold
  ring:   ['#2E7D32', '#C2185B', '#1565C0', '#6A1B9A', '#E65100'],   // Forest, rose, blue, purple, ember
  shape:  ['#43A047', '#E91E63', '#1E88E5'],                          // Green, pink, blue (saturated)
  accent: ['#FF6D00', '#00ACC1', '#AB47BC'],                          // Orange, teal, purple (vivid)
};

const BG_PATTERNS   = ['checkerboard', 'diagonal', 'hBars', 'vBars', 'solid'];
const RING_STYLES   = ['solid', 'dashed', 'double'];
const SHAPE_NAMES   = ['cross', 'flower', 'star', 'diamond', 'clover'];
const ACCENT_SHAPES = ['circles', 'diamonds', 'squares', 'triangles', 'dots'];

// Build 4 independent pools of 15 attributes each (total 60, ids 0-59)
function buildPools() {
  let id = 0;

  const bg = [];
  for (const pattern of BG_PATTERNS) {
    for (const color of PALETTE.bg) {
      bg.push({ id: id++, type: 'bg', color, pattern });
    }
  } // 5×3 = 15, ids 0-14

  const ring = [];
  for (const color of PALETTE.ring) {
    for (const style of RING_STYLES) {
      ring.push({ id: id++, type: 'ring', color, style });
    }
  } // 5×3 = 15, ids 15-29

  const shape = [];
  for (const shapeName of SHAPE_NAMES) {
    for (const color of PALETTE.shape) {
      shape.push({ id: id++, type: 'shape', color, shape: shapeName });
    }
  } // 5×3 = 15, ids 30-44

  const accent = [];
  for (const accentShape of ACCENT_SHAPES) {
    for (const color of PALETTE.accent) {
      accent.push({ id: id++, type: 'accent', color, accentShape });
    }
  } // 5×3 = 15, ids 45-59

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
  const pools = buildPools();

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

  return { tiles, rows: ROWS, cols: COLS };
}

// Game state management
class GameState {
  constructor() {
    this.board = null;
    this.selectedTile = null;
    this.currentCombo = 0;
    this.longestCombo = 0;
    this.tilesCleared = 0;
    this.totalTiles = TILE_COUNT;
    this.moveCount = 0;
  }

  newGame() {
    this.board = generateBoard();
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

export { GameState, ROWS, COLS, TILE_COUNT, PALETTE };
