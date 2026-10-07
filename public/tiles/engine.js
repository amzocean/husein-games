// engine.js — Board generation and game logic for Fatema Tiles

const ROWS = 5;
const COLS = 5;
const TILE_COUNT = ROWS * COLS; // 25
const ACTIVE_TILES = 24;        // center tile is decorative
const CENTER_INDEX = 12;         // position [2,2] in 5x5 grid

// ── Theme Definitions ──
// Each theme: palette (bg 3, ring 4, shape 3, accent 3), bgPatterns 5, ringStyles 3, shapeNames 4, accentShapes 4
// Pool math: ring 4×3=12, shape 4×3=12, accent 4×3=12 (bg is board-level only, not matchable)

const ARCHIVED_THEMES = [
  {
    name: 'Coffee & Quiet Mornings', emoji: '☕',
    style: 'cute-light',
    palette: {
      bg:     ['#D4915E', '#FFD966', '#A8C95F'],
      ring:   ['#C4741A', '#4FA35A', '#7C5BA8', '#DA3D52'],
      shape:  ['#D4691A', '#4FA35A', '#7C5BA8'],
      accent: ['#E8A836', '#2FA8A8', '#DA3D52'],
    },
    bgPatterns:   ['coffee-steam-wisps', 'coffee-bean-scatter', 'coffee-table-grain', 'coffee-sunrise-bands', 'coffee-shared-table-edge'],
    ringStyles:   ['coffee-cup-rim-frame', 'coffee-bead-border', 'coffee-table-corner-arch'],
    shapeNames:   ['coffee-paired-mugs', 'coffee-heart-steam', 'coffee-bean-heart', 'coffee-breakfast-for-two'],
    accentShapes: ['coffee-mini-beans', 'coffee-steam-curls', 'coffee-spoon-kisses', 'coffee-saucer-dots'],
    boardBg:      { pattern: 'coffee-steam-wisps', color: '#D4915E' },
  },
  {
    name: 'Moonlit Garden Path', emoji: '🌙',
    style: 'cute-light',
    palette: {
      bg:     ['#5A6BB8', '#D8D0E8', '#E8B0D0'],
      ring:   ['#1A9BC8', '#7C5BA8', '#FF4A6A', '#FFD43B'],
      shape:  ['#2A9FE8', '#FF3D5A', '#FFD63B'],
      accent: ['#1A9BC8', '#7C5BA8', '#FFD63B'],
    },
    bgPatterns:   ['moonlit-lantern-glow', 'moonlit-garden-arch', 'moonlit-vine-trails', 'moonlit-starlit-path', 'moonlit-moonflower-lattice'],
    ringStyles:   ['moonlit-arch-frame', 'moonlit-lantern-border', 'moonlit-vine-oval'],
    shapeNames:   ['moonlit-crescent-path', 'moonlit-garden-lantern', 'moonlit-moonflower-stem', 'moonlit-intertwined-vines'],
    accentShapes: ['moonlit-mini-lanterns', 'moonlit-small-stars', 'moonlit-flower-bursts', 'moonlit-vine-curls'],
    boardBg:      { pattern: 'moonlit-lantern-glow', color: '#5A6BB8' },
  },
  {
    name: 'Pressed Flowers & Letters', emoji: '💌',
    style: 'cute-light',
    palette: {
      bg:     ['#E8A8B8', '#E8D8A8', '#B8C890'],
      ring:   ['#A8D428', '#2A9BA8', '#7C5BA8', '#C85A5A'],
      shape:  ['#D4A838', '#2A9BA8', '#7C5BA8'],
      accent: ['#D4841A', '#4FA8A8', '#C85A7A'],
    },
    bgPatterns:   ['flowers-letter-lines', 'flowers-pressed-stems', 'flowers-ribbon-diagonals', 'flowers-seal-imprints', 'flowers-paper-grain'],
    ringStyles:   ['flowers-envelope-frame', 'flowers-ribbon-wrap-border', 'flowers-seal-medallion-arch'],
    shapeNames:   ['flowers-open-letter', 'flowers-pressed-bouquet', 'flowers-wax-seal-heart', 'flowers-ribbon-keepsake'],
    accentShapes: ['flowers-petal-sprigs', 'flowers-ribbon-ties', 'flowers-seal-dots', 'flowers-leaf-pairs'],
    boardBg:      { pattern: 'flowers-letter-lines', color: '#E8A8B8' },
  },
  {
    name: 'Velvet & Whispered Words', emoji: '🎀',
    style: 'cute-light',
    palette: {
      bg:     ['#D8A8C8', '#E8D8D0', '#A8D4BC'],
      ring:   ['#C85A98', '#4A7EC4', '#D4B836', '#5AB836'],
      shape:  ['#E85A5A', '#7C5BA8', '#2A9BA8'],
      accent: ['#DA5A7A', '#4FA35A', '#2A9BA8'],
    },
    bgPatterns:   ['velvet-plush-folds', 'velvet-pearl-scatter', 'velvet-ribbon-drape', 'velvet-whisper-lines', 'velvet-knot-lattice'],
    ringStyles:   ['velvet-locket-frame', 'velvet-bow-border', 'velvet-pearl-oval'],
    shapeNames:   ['velvet-heart-locket', 'velvet-ribbon-bow', 'velvet-pearl-knot', 'velvet-whisper-heart'],
    accentShapes: ['velvet-pearls', 'velvet-mini-bows', 'velvet-soft-knots', 'velvet-locket-sparks'],
    boardBg:      { pattern: 'velvet-plush-folds', color: '#D8A8C8' },
  },
  {
    name: 'Constellation of You', emoji: '⭐',
    style: 'cute-light',
    palette: {
      bg:     ['#6A7AC4', '#9AAAE8', '#C4B89A'],
      ring:   ['#E85A5A', '#2A9BA8', '#D4B836', '#4FA35A'],
      shape:  ['#4A7EC4', '#D4881A', '#9AD4A8'],
      accent: ['#C85A98', '#DA881A', '#4FA35A'],
    },
    bgPatterns:   ['constellation-starfield', 'constellation-comet-arcs', 'constellation-cluster-links', 'constellation-night-bands', 'constellation-golden-dust'],
    ringStyles:   ['constellation-star-link-frame', 'constellation-comet-border', 'constellation-orbit-oval'],
    shapeNames:   ['constellation-heart-map', 'constellation-shooting-star', 'constellation-cluster-heart', 'constellation-moon-medallion'],
    accentShapes: ['constellation-mini-stars', 'constellation-comet-tails', 'constellation-spark-crosses', 'constellation-link-dots'],
    boardBg:      { pattern: 'constellation-starfield', color: '#6A7AC4' },
  },
  {
    name: 'Roses & Ribbons', emoji: '🌹',
    style: 'cute-light',
    palette: {
      bg:     ['#E85A8A', '#E8C8C8', '#C8E8C8'],
      ring:   ['#C85A7A', '#4A7EC4', '#9AD4A8', '#D4881A'],
      shape:  ['#E85A5A', '#7C5BA8', '#4FA35A'],
      accent: ['#DA5A8A', '#2A9BA8', '#D4B836'],
    },
    bgPatterns:   ['roses-trailing-stems', 'roses-petal-rain', 'roses-silk-stripes', 'roses-garden-trellis', 'roses-perfume-mist'],
    ringStyles:   ['roses-vine-frame', 'roses-bow-corner-border', 'roses-arching-bloom'],
    shapeNames:   ['roses-paired-blooms', 'roses-bouquet-bow', 'roses-heart-petals', 'roses-stem-love-knot'],
    accentShapes: ['roses-mini-petals', 'roses-rosebuds', 'roses-silk-bows', 'roses-leaf-pairs'],
    boardBg:      { pattern: 'roses-trailing-stems', color: '#E85A8A' },
  },
  {
    name: 'Handwritten "I Love You"', emoji: '✍️',
    style: 'cute-light',
    palette: {
      bg:     ['#DA5A8A', '#F0E8D8', '#D8E8D8'],
      ring:   ['#C85A7A', '#4A7EC4', '#D4B836', '#4FA35A'],
      shape:  ['#E85A5A', '#7C5BA8', '#9AD4A8'],
      accent: ['#DA5A7A', '#2A9BA8', '#D4881A'],
    },
    bgPatterns:   ['handwritten-paper-lines', 'handwritten-ink-flourishes', 'handwritten-margin-curls', 'handwritten-heart-words', 'handwritten-folded-page'],
    ringStyles:   ['handwritten-script-frame', 'handwritten-flourish-border', 'handwritten-pen-arch'],
    shapeNames:   ['handwritten-ily-heart', 'handwritten-pen-nib', 'handwritten-love-note', 'handwritten-heart-script'],
    accentShapes: ['handwritten-ink-dots', 'handwritten-mini-hearts', 'handwritten-pen-flicks', 'handwritten-comma-curls'],
    boardBg:      { pattern: 'handwritten-paper-lines', color: '#DA5A8A' },
  },
];

const THEMES = [

  {
    name: 'Italian Dolce Vita', emoji: '🍝',
    style: 'cute-light',
    palette: {
      bg:     ['#8A3A2A', '#FFF5E0', '#1A5A1A'],
      ring:   ['#2A1010', '#0A4A0A', '#FF5A0A', '#CC9800'],
      shape:  ['#FF2A00', '#2ABA00', '#FFDC00'],
      accent: ['#FF6A2A', '#6ADA2A', '#FFED50'],
    },
    bgPatterns:   ['italian-grape-vine', 'italian-pasta-frame', 'italian-tomato-vine', 'italian-oil-drip', 'italian-basil-scatter'],
    ringStyles:   ['italian-olive-rim', 'italian-vine-spiral', 'italian-pasta-loop'],
    shapeNames:   ['italian-wine-glass', 'italian-pasta-fork', 'italian-tomato-slice', 'italian-olive-spray'],
    accentShapes: ['italian-basil-leaf', 'italian-wine-drop', 'italian-olive-cluster', 'italian-pasta-dot'],
    boardBg:      { pattern: 'italian-grape-vine', color: '#C85A2A' },
  },

  {
    name: 'Indian Masala Magic', emoji: '🌶️',
    style: 'cute-light',
    palette: {
      bg:     ['#AA4A2A', '#FFF8E8', '#1A6A1A'],
      ring:   ['#3A0A00', '#0A5A0A', '#FFB000', '#FF0A00'],
      shape:  ['#FF2A00', '#4ADA00', '#FFD000'],
      accent: ['#FF7A2A', '#6AEA2A', '#FFEC40'],
    },
    bgPatterns:   ['indian-chai-steam', 'indian-spice-dust', 'indian-mandala-circles', 'indian-naan-texture', 'indian-saffron-strands'],
    ringStyles:   ['indian-chai-rim', 'indian-spice-border', 'indian-mandala-frame'],
    shapeNames:   ['indian-chai-cup', 'indian-naan-tear', 'indian-spice-burst', 'indian-cardamom-cluster'],
    accentShapes: ['indian-cardamom-seed', 'indian-chai-drop', 'indian-saffron-strand', 'indian-spice-dot'],
    boardBg:      { pattern: 'indian-chai-steam', color: '#D4411A' },
  },

  {
    name: 'Mediterranean Grace', emoji: '🫒',
    style: 'cute-light',
    palette: {
      bg:     ['#0A4A8A', '#FFF5E8', '#1A7A1A'],
      ring:   ['#1A1010', '#0A5A0A', '#FFC000', '#003A8A'],
      shape:  ['#0AAAAA', '#FFDC00', '#3ADA3A'],
      accent: ['#2AAAAA', '#FFED50', '#5AEA5A'],
    },
    bgPatterns:   ['med-olive-oil-pour', 'med-lemon-grove', 'med-sea-waves', 'med-feta-crumble', 'med-branch-scatter'],
    ringStyles:   ['med-olive-rim', 'med-lemon-border', 'med-wave-spiral'],
    shapeNames:   ['med-olive-oil-bottle', 'med-lemon-slice', 'med-feta-cube', 'med-octopus-tentacle'],
    accentShapes: ['med-olive-berry', 'med-lemon-drop', 'med-feta-speck', 'med-branch-leaf'],
    boardBg:      { pattern: 'med-olive-oil-pour', color: '#2A7A8A' },
  },

  {
    name: 'Mexican Fiesta', emoji: '🌮',
    style: 'cute-light',
    palette: {
      bg:     ['#8A2A1A', '#FFF5E8', '#1A6A1A'],
      ring:   ['#2A0A0A', '#0A5A0A', '#FFC000', '#FF0000'],
      shape:  ['#FF2A00', '#2ADA00', '#FFDC00'],
      accent: ['#FF6A1A', '#6AEA2A', '#FFED50'],
    },
    bgPatterns:   ['mexican-chili-scatter', 'mexican-lime-burst', 'mexican-cilantro-weave', 'mexican-avocado-halves', 'mexican-folk-zigzag'],
    ringStyles:   ['mexican-chili-rim', 'mexican-lime-border', 'mexican-tile-spiral'],
    shapeNames:   ['mexican-chili-pepper', 'mexican-lime-splash', 'mexican-cilantro-bunch', 'mexican-avocado-half'],
    accentShapes: ['mexican-chili-seed', 'mexican-lime-drop', 'mexican-cilantro-sprig', 'mexican-avocado-pit'],
    boardBg:      { pattern: 'mexican-chili-scatter', color: '#D41A1A' },
  },

  {
    name: 'Middle Eastern Spice Route', emoji: '🫐',
    style: 'cute-light',
    palette: {
      bg:     ['#6A3A1A', '#FFF5E0', '#1A6A1A'],
      ring:   ['#2A1010', '#0A5A0A', '#FFB000', '#CC2A1A'],
      shape:  ['#FF4A0A', '#4ADA1A', '#FFDC00'],
      accent: ['#FF7A2A', '#6AEA2A', '#FFED50'],
    },
    bgPatterns:   ['me-pomegranate-scatter', 'me-pistachio-pair', 'me-zaatar-dust', 'me-date-palm', 'me-arabic-pattern'],
    ringStyles:   ['me-pomegranate-rim', 'me-pistachio-border', 'me-arabesque-spiral'],
    shapeNames:   ['me-pomegranate-arils', 'me-pistachio-pair', 'me-zaatar-burst', 'me-date-pit'],
    accentShapes: ['me-pomegranate-seed', 'me-pistachio-shell', 'me-zaatar-speck', 'me-date-drop'],
    boardBg:      { pattern: 'me-pomegranate-scatter', color: '#8A4A2A' },
  },
];

// ── Birthday Countdown Themes ──
// Scheduled, date-locked themes for Fatema's birthday countdown (Sept 2–6, 2026).
// NOT part of THEMES — never enter the random rotation. generateBoard() checks
// BIRTHDAY_THEMES first (by UTC calendar date) before falling back to THEMES.
// Each entry carries activeDate (YYYY-MM-DD, UTC) and countdownMessage shown in the toast.
const BIRTHDAY_THEMES = [
  {
    name: 'September Sparkle', emoji: '✨',
    activeDate: '2026-09-02',
    countdownMessage: '4 days until Fatema’s birthday',
    palette: {
      bg:     ['#ff4f9c', '#ffce3d', '#22c1c9'],
      ring:   ['#9c1257', '#8a6a00', '#0b7b81', '#5b21b6'],
      shape:  ['#a81261', '#8f5f00', '#0e6b70'],
      accent: ['#c2185b', '#00838f', '#6a1fb5'],
    },
    bgPatterns:   ['septspark-confetti-shower', 'septspark-glitter-drift', 'septspark-firework-trails', 'septspark-ribbon-swirls', 'septspark-star-scatter'],
    ringStyles:   ['septspark-sequin-frame', 'septspark-sparkle-dash', 'septspark-starlight-arch'],
    shapeNames:   ['septspark-cupcake', 'septspark-sparkler', 'septspark-gift-star', 'septspark-party-hat'],
    accentShapes: ['septspark-stars', 'septspark-confetti', 'septspark-sparkle-bursts', 'septspark-ribbons'],
    boardBg:      { pattern: 'septspark-confetti-shower', color: '#ff4f9c' },
  },
  {
    name: 'Wrapped With Love', emoji: '🎁',
    activeDate: '2026-09-03',
    countdownMessage: '3 days until Fatema’s birthday',
    palette: {
      bg:     ['#e8385f', '#f2a541', '#7d5fff'],
      ring:   ['#9c1030', '#8a5a06', '#4a35b0', '#7a1150'],
      shape:  ['#a3123a', '#8f5c08', '#4433ad'],
      accent: ['#b5123f', '#a5660a', '#4f35b3'],
    },
    bgPatterns:   ['wraplove-gift-tags', 'wraplove-ribbon-weave', 'wraplove-paper-folds', 'wraplove-bow-trails', 'wraplove-heart-wrap'],
    ringStyles:   ['wraplove-ribbon-frame', 'wraplove-bow-corners', 'wraplove-tag-string-border'],
    shapeNames:   ['wraplove-gift-box', 'wraplove-bow', 'wraplove-heart-tag', 'wraplove-wrapped-heart'],
    accentShapes: ['wraplove-bows', 'wraplove-tags', 'wraplove-hearts', 'wraplove-ribbon-curls'],
    boardBg:      { pattern: 'wraplove-gift-tags', color: '#e8385f' },
  },
  {
    name: 'Balloons & Kisses', emoji: '🎈',
    style: 'bold-sticker',
    activeDate: '2026-09-04',
    countdownMessage: '2 days until Fatema’s birthday',
    palette: {
      bg:     ['#ff2e7e', '#ffb100', '#2f6fed'],
      ring:   ['#8a0f42', '#8a5a00', '#123f8a', '#146356'],
      shape:  ['#9c1049', '#8a5c05', '#163f8a'],
      accent: ['#a3124f', '#956008', '#1c4a95'],
    },
    bgPatterns:   ['balloonkiss-confetti-pop', 'balloonkiss-balloon-strings', 'balloonkiss-lipstick-marks', 'balloonkiss-streamer-waves', 'balloonkiss-polka-scatter'],
    ringStyles:   ['balloonkiss-patch-frame', 'balloonkiss-varsity-double', 'balloonkiss-ticket-patch'],
    shapeNames:   ['balloonkiss-balloon-bunch', 'balloonkiss-kiss-lips', 'balloonkiss-party-popper', 'balloonkiss-cupcake-sticker'],
    accentShapes: ['balloonkiss-kiss-marks', 'balloonkiss-balloon-dots', 'balloonkiss-confetti-badges', 'balloonkiss-star-badges'],
    boardBg:      { pattern: 'balloonkiss-confetti-pop', color: '#ff2e7e' },
  },
  {
    name: 'Birthday Eve Wishes', emoji: '🕯️',
    activeDate: '2026-09-05',
    countdownMessage: 'Tomorrow is Fatema’s birthday',
    palette: {
      bg:     ['#6c3ce8', '#ff8a3d', '#ff6f91'],
      ring:   ['#4a1fae', '#a4470a', '#8a1246', '#6d2e8f'],
      shape:  ['#551fb8', '#a84e0d', '#93144c'],
      accent: ['#5f2ac2', '#b9560f', '#9c1552'],
    },
    bgPatterns:   ['candleeve-candle-glow', 'candleeve-starlit-sky', 'candleeve-wish-ribbons', 'candleeve-melting-wax', 'candleeve-nightfall-bands'],
    ringStyles:   ['candleeve-flame-frame', 'candleeve-wish-dash', 'candleeve-glow-arch'],
    shapeNames:   ['candleeve-lit-candle', 'candleeve-wish-star', 'candleeve-crescent-moon', 'candleeve-cake-silhouette'],
    accentShapes: ['candleeve-flames', 'candleeve-stars', 'candleeve-wish-sparkles', 'candleeve-moons'],
    boardBg:      { pattern: 'candleeve-nightfall-bands', color: '#6c3ce8' },
  },
  {
    name: 'Fatema\'s Birthday', emoji: '🎂',
    style: 'bold-sticker',
    activeDate: '2026-09-06',
    countdownMessage: 'Happy Birthday, Fatema! 💖',
    palette: {
      bg:     ['#ff1f7a', '#ffd400', '#00c853'],
      ring:   ['#8a0f45', '#8a6a00', '#0b7a3a', '#4a1470'],
      shape:  ['#9c1049', '#8f6d02', '#0e8241'],
      accent: ['#a3124f', '#a6790a', '#127a45'],
    },
    bgPatterns:   ['fbday-cake-confetti', 'fbday-candle-flicker', 'fbday-balloon-parade', 'fbday-cake-frosting-swirls', 'fbday-celebration-burst'],
    ringStyles:   ['fbday-patch-frame', 'fbday-varsity-double', 'fbday-ticket-patch'],
    shapeNames:   ['fbday-birthday-cake', 'fbday-crown-sticker', 'fbday-gift-sticker', 'fbday-number-candle'],
    accentShapes: ['fbday-confetti-badges', 'fbday-star-badges', 'fbday-heart-badges', 'fbday-candle-badges'],
    boardBg:      { pattern: 'fbday-cake-confetti', color: '#ff1f7a' },
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

// Returns today's scheduled birthday theme, or null outside the countdown window.
// Uses the same simple browser UTC date convention as the daily photo picker:
// new Date().toISOString().slice(0, 10) — no timezone library or conversion.
function getScheduledBirthdayTheme() {
  const today = new Date().toISOString().slice(0, 10);
  return BIRTHDAY_THEMES.find(theme => theme.activeDate === today) || null;
}

// Generate board: per-type pair-and-shuffle guarantees solvability by construction
function generateBoard() {
  // Sept 2–6, 2026 (UTC): always the scheduled countdown theme, every New Board press.
  // Outside that window: random selection among the active THEMES.
  const theme = getScheduledBirthdayTheme() || THEMES[Math.floor(Math.random() * THEMES.length)];
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

export { GameState, ROWS, COLS, TILE_COUNT, ACTIVE_TILES, CENTER_INDEX, THEMES, BIRTHDAY_THEMES };
