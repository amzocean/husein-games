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
    name: 'Love Letters', emoji: '💌',
    style: 'graphic-composition',
    palette: {
      bg:     ['#e6a5a1', '#d0ad7f', '#73a6a1'],
      ring:   ['#7f1d3f', '#5b3a29', '#245c59', '#5b3473'],
      shape:  ['#8a244b', '#684126', '#27665f'],
      accent: ['#9b2c54', '#2f6b62', '#6b3c78'],
    },
    bgPatterns:   ['love-paper-lines', 'love-handwriting-flow', 'love-envelope-folds', 'love-postmark-trails', 'love-ink-wash'],
    ringStyles:   ['love-envelope-frame', 'love-stamp-edge', 'love-ribbon-border'],
    shapeNames:   ['love-envelope', 'love-fountain-pen', 'love-wax-seal', 'love-folded-note'],
    accentShapes: ['love-hearts', 'love-stamps', 'love-ink-drops', 'love-kisses'],
    boardBg:      { pattern: 'love-paper-lines', color: '#e6a5a1' },
  },
  {
    name: 'Moonlit Promise', emoji: '🌙',
    palette: {
      bg:     ['#263f73', '#76518f', '#b5684f'],
      ring:   ['#172b55', '#512d6d', '#7a352c', '#315b62'],
      shape:  ['#1f3766', '#5c3478', '#843d31'],
      accent: ['#6c2f67', '#1f5a64', '#8a3f35'],
    },
    bgPatterns:   ['moon-night-waves', 'moon-star-trails', 'moon-constellation-lines', 'moon-dusk-bands', 'moon-lantern-glow'],
    ringStyles:   ['moon-crescent-frame', 'moon-star-chain', 'moon-orbit-border'],
    shapeNames:   ['moon-crescent', 'moon-lantern', 'moon-telescope', 'moon-promise-rings'],
    accentShapes: ['moon-stars', 'moon-crescents', 'moon-fireflies', 'moon-sparkles'],
    boardBg:      { pattern: 'moon-night-waves', color: '#263f73' },
  },
  {
    name: 'Rose Garden', emoji: '🌹',
    palette: {
      bg:     ['#b95672', '#63804d', '#c09436'],
      ring:   ['#7f1d3d', '#36572c', '#735416', '#533568'],
      shape:  ['#8f294b', '#3d6634', '#7d5a18'],
      accent: ['#9a3050', '#2f6a4b', '#634078'],
    },
    bgPatterns:   ['rose-vine-lines', 'rose-trellis', 'rose-petal-drift', 'rose-leaf-veins', 'rose-summer-rain'],
    ringStyles:   ['rose-thorn-vine', 'rose-garland', 'rose-garden-arch'],
    shapeNames:   ['rose-bloom', 'rose-bouquet', 'rose-watering-can', 'rose-garden-bench'],
    accentShapes: ['rose-petals', 'rose-leaves', 'rose-buds', 'rose-butterflies'],
    boardBg:      { pattern: 'rose-vine-lines', color: '#b95672' },
  },
  {
    name: 'Home With You', emoji: '🏡',
    style: 'bold-sticker',
    palette: {
      bg:     ['#c4774f', '#6f927f', '#687b9d'],
      ring:   ['#6f3425', '#315b4b', '#344b72', '#653b58'],
      shape:  ['#7d3e2b', '#376754', '#3c527c'],
      accent: ['#7b2f49', '#2f6657', '#4d4275'],
    },
    bgPatterns:   ['home-quilt-stitches', 'home-window-light', 'home-wood-grain', 'home-cozy-lines', 'home-roof-hatch'],
    ringStyles:   ['home-picture-frame', 'home-doorway-border', 'home-stitched-edge'],
    shapeNames:   ['home-house', 'home-teacups', 'home-lamp', 'home-key'],
    accentShapes: ['home-windows', 'home-cushions', 'home-hearts', 'home-stars'],
    boardBg:      { pattern: 'home-quilt-stitches', color: '#c4774f' },
  },
  {
    name: 'Shared Journeys', emoji: '🧭',
    style: 'bold-sticker',
    palette: {
      bg:     ['#2f7476', '#b36a3f', '#79588f'],
      ring:   ['#174f53', '#743923', '#4e3269', '#5d5522'],
      shape:  ['#1d5b5e', '#824429', '#563971'],
      accent: ['#6d2e45', '#245f55', '#644079'],
    },
    bgPatterns:   ['journey-route-lines', 'journey-map-folds', 'journey-horizon-bands', 'journey-rail-tracks', 'journey-passport-marks'],
    ringStyles:   ['journey-ticket-frame', 'journey-compass-border', 'journey-luggage-strap'],
    shapeNames:   ['journey-compass', 'journey-suitcase', 'journey-airplane', 'journey-camera'],
    accentShapes: ['journey-map-pins', 'journey-tickets', 'journey-footprints', 'journey-arrows'],
    boardBg:      { pattern: 'journey-route-lines', color: '#2f7476' },
  },
  {
    name: 'Forever Fatema', emoji: '💖',
    style: 'graphic-composition',
    palette: {
      bg:     ['#7f234c', '#ad872c', '#326573'],
      ring:   ['#5e1738', '#735611', '#174b58', '#59306d'],
      shape:  ['#6d1c42', '#7e6018', '#1d5562'],
      accent: ['#8b2850', '#285f58', '#623878'],
    },
    bgPatterns:   ['fatema-signature-lines', 'fatema-jewel-shimmer', 'fatema-infinity-weave', 'fatema-celebration-ribbons', 'fatema-golden-glow'],
    ringStyles:   ['fatema-monogram-frame', 'fatema-promise-bands', 'fatema-forever-loop'],
    shapeNames:   ['fatema-letter-f', 'fatema-infinity-heart', 'fatema-two-rings', 'fatema-crown'],
    accentShapes: ['fatema-initials', 'fatema-hearts', 'fatema-diamonds', 'fatema-stars'],
    boardBg:      { pattern: 'fatema-signature-lines', color: '#7f234c' },
  },
];

// Archived themes — preserved for reference, not selectable in-game
const ARCHIVED_THEMES = [
  // Archived August 2026 (romantic collection rotation)
  {
    name: 'Istanbul', emoji: '🌉',
    palette: {
      bg:     ['#0f6b78', '#c65d35', '#6e5aa8'],
      ring:   ['#183153', '#7a2432', '#3f5f2a', '#5b2c83'],
      shape:  ['#164e63', '#7f1d1d', '#3f6212'],
      accent: ['#8a3b12', '#14532d', '#4c1d70'],
    },
    bgPatterns:   ['ist-bosphorus-lines', 'ist-tram-tracks', 'ist-tile-hatch', 'ist-market-stripes', 'ist-rain-streaks'],
    ringStyles:   ['ist-arch-frame', 'ist-bridge-rail', 'ist-tulip-border'],
    shapeNames:   ['ist-mosque', 'ist-ferry', 'ist-tram', 'ist-tea-glass'],
    accentShapes: ['ist-tulips', 'ist-seagulls', 'ist-lanterns', 'ist-tiles'],
    boardBg:      { pattern: 'solid', color: '#0f6b78' },
  },
  {
    name: 'Cairo', emoji: '🐪',
    style: 'bold-sticker',
    palette: {
      bg:     ['#d97706', '#0e7490', '#be185d'],
      ring:   ['#713f12', '#164e63', '#7f1d1d', '#4c1d95'],
      shape:  ['#854d0e', '#155e75', '#6b21a8'],
      accent: ['#9f1239', '#166534', '#3730a3'],
    },
    bgPatterns:   ['cai-sand-grain', 'cai-nile-lines', 'cai-market-weave', 'cai-stone-hatch', 'cai-sun-streaks'],
    ringStyles:   ['cai-temple-patch', 'cai-nile-patch', 'cai-desert-ticket'],
    shapeNames:   ['cai-pyramid', 'cai-sphinx', 'cai-felucca', 'cai-obelisk'],
    accentShapes: ['cai-sun-discs', 'cai-papyrus', 'cai-cartouches', 'cai-scarabs'],
    boardBg:      { pattern: 'solid', color: '#d97706' },
  },
  {
    name: 'Singapore', emoji: '🌳',
    style: 'bold-sticker',
    palette: {
      bg:     ['#13a86b', '#e24a68', '#5167d9'],
      ring:   ['#164e63', '#7c2d12', '#365314', '#581c87'],
      shape:  ['#1e40af', '#9f1239', '#166534'],
      accent: ['#6b21a8', '#b91c1c', '#0f766e'],
    },
    bgPatterns:   ['sgp-rain-wash', 'sgp-glass-seams', 'sgp-garden-fibers', 'sgp-transit-scan', 'sgp-harbor-haze'],
    ringStyles:   ['sgp-skyline-patch', 'sgp-garden-badge', 'sgp-harbor-ticket'],
    shapeNames:   ['sgp-merlion', 'sgp-supertree', 'sgp-marina-hotel', 'sgp-orchid'],
    accentShapes: ['sgp-rain-badges', 'sgp-orchid-badges', 'sgp-ship-badges', 'sgp-transit-chevrons'],
    boardBg:      { pattern: 'solid', color: '#13a86b' },
  },
  {
    name: 'Rio de Janeiro', emoji: '🚠',
    style: 'bold-sticker',
    palette: {
      bg:     ['#65a30d', '#0369a1', '#c026d3'],
      ring:   ['#14532d', '#1e3a8a', '#86198f', '#9a3412'],
      shape:  ['#166534', '#075985', '#7e22ce'],
      accent: ['#9f1239', '#115e59', '#7c2d12'],
    },
    bgPatterns:   ['rio-boardwalk-grain', 'rio-mountain-lines', 'rio-samba-stripes', 'rio-ocean-streaks', 'rio-city-rain'],
    ringStyles:   ['rio-promenade-patch', 'rio-cable-frame', 'rio-samba-ticket'],
    shapeNames:   ['rio-sugarloaf', 'rio-cable-car', 'rio-tram', 'rio-boardwalk'],
    accentShapes: ['rio-drums', 'rio-waves', 'rio-kites', 'rio-leaves'],
    boardBg:      { pattern: 'solid', color: '#0369a1' },
  },
  {
    name: 'Cape Town', emoji: '🏔️',
    palette: {
      bg:     ['#6b8e23', '#c45d42', '#3b82a0'],
      ring:   ['#365314', '#7f1d1d', '#164e63', '#4c1d95'],
      shape:  ['#3f6212', '#9a3412', '#155e75'],
      accent: ['#831843', '#14532d', '#312e81'],
    },
    bgPatterns:   ['cpt-fynbos-grain', 'cpt-coast-lines', 'cpt-mountain-hatch', 'cpt-harbor-stripes', 'cpt-cloud-streaks'],
    ringStyles:   ['cpt-mountain-edge', 'cpt-coast-route', 'cpt-cable-frame'],
    shapeNames:   ['cpt-table-mountain', 'cpt-cable-car', 'cpt-protea', 'cpt-penguin'],
    accentShapes: ['cpt-waves', 'cpt-flowers', 'cpt-seals', 'cpt-stars'],
    boardBg:      { pattern: 'solid', color: '#6b8e23' },
  },
  {
    name: 'Mexico City', emoji: '🌵',
    palette: {
      bg:     ['#c2415d', '#2f855a', '#b7791f'],
      ring:   ['#1e3a5f', '#7f1d1d', '#14532d', '#581c87'],
      shape:  ['#1d4ed8', '#9f1239', '#3f6212'],
      accent: ['#6b21a8', '#b45309', '#0f766e'],
    },
    bgPatterns:   ['mxc-plaza-grain', 'mxc-avenida-lines', 'mxc-market-fibers', 'mxc-tile-wash', 'mxc-highland-haze'],
    ringStyles:   ['mxc-plaza-frame', 'mxc-avenida-border', 'mxc-papel-border'],
    shapeNames:   ['mxc-angel', 'mxc-trajinera', 'mxc-cactus', 'mxc-pyramid'],
    accentShapes: ['mxc-marigolds', 'mxc-metro-gems', 'mxc-market-flags', 'mxc-sun-dots'],
    boardBg:      { pattern: 'solid', color: '#c2415d' },
  },
  // Archived August 2026 (city collection rotation)
  {
    name: 'Airport', emoji: '✈️',
    style: 'bold-sticker',
    palette: {
      bg:     ['#168aad', '#ff7b00', '#e63973'],
      ring:   ['#023e8a', '#9d0208', '#006d5b', '#5a189a'],
      shape:  ['#075985', '#991b1b', '#3730a3'],
      accent: ['#134e4a', '#831843', '#581c87'],
    },
    bgPatterns:   ['air-runway-grain', 'air-concourse-lines', 'air-gate-stripes', 'air-taxiway-tracks', 'air-window-rain'],
    ringStyles:   ['air-runway-border', 'air-gate-frame', 'air-boarding-band'],
    shapeNames:   ['air-jet', 'air-control-tower', 'air-suitcase', 'air-gate-sign'],
    accentShapes: ['air-beacons', 'air-chevrons', 'air-tags', 'air-flightmarks'],
    boardBg:      { pattern: 'solid', color: '#168aad' },
  },
  {
    name: 'Museum', emoji: '🖼️',
    palette: {
      bg:     ['#704264', '#667b4f', '#a85d3d'],
      ring:   ['#283593', '#00695c', '#8b3a3a', '#5d4037'],
      shape:  ['#1a4f63', '#6a1b4d', '#3d5a2a'],
      accent: ['#123a63', '#006064', '#37474f'],
    },
    bgPatterns:   ['mus-gallery-wash', 'mus-wall-seams', 'mus-tracklight-lines', 'mus-label-lines', 'mus-concrete-grain'],
    ringStyles:   ['mus-gallery-frame', 'mus-display-edge', 'mus-guide-rail'],
    shapeNames:   ['mus-frame-art', 'mus-sculpture', 'mus-pedestal', 'mus-audio-guide'],
    accentShapes: ['mus-labels', 'mus-wayfinding', 'mus-ticket-tabs', 'mus-trackmarks'],
    boardBg:      { pattern: 'solid', color: '#704264' },
  },
  {
    name: 'Stadium Composition', emoji: '🖨️',
    style: 'graphic-composition',
    palette: {
      bg:     ['#d7f205', '#ff4d6d', '#5f4bdb'],
      ring:   ['#17324d', '#74205f', '#176b57', '#a23b0a'],
      shape:  ['#1e3a5f', '#8c1c4f', '#3a5f0b'],
      accent: ['#51258a', '#a61b29', '#006466'],
    },
    bgPatterns:   ['cmpstd-paper-grain', 'cmpstd-registration-lines', 'cmpstd-print-fibers', 'cmpstd-soft-scan', 'cmpstd-ink-wash'],
    ringStyles:   ['cmpstd-diagonal-split', 'cmpstd-stacked-bands', 'cmpstd-offset-blocks'],
    shapeNames:   ['cmpstd-dot-field', 'cmpstd-stripe-field', 'cmpstd-checker-mesh', 'cmpstd-crosshatch'],
    accentShapes: ['cmpstd-repeated-circles', 'cmpstd-parallel-arrows', 'cmpstd-scattered-capsules', 'cmpstd-mirrored-marks'],
    boardBg:      { pattern: 'cmpstd-paper-grain', color: '#d7f205' },
  },
  {
    name: 'Marina', emoji: '⛵',
    style: 'bold-sticker',
    palette: {
      bg:     ['#00b4d8', '#ff5d5d', '#f4b400'],
      ring:   ['#003566', '#9b2226', '#4d7c0f', '#6b21a8'],
      shape:  ['#00509d', '#9f1239', '#166534'],
      accent: ['#1e3a8a', '#9d174d', '#7c2d12'],
    },
    bgPatterns:   ['mar-water-lines', 'mar-dock-planks', 'mar-rigging-lines', 'mar-wake-streaks', 'mar-harbor-rain'],
    ringStyles:   ['mar-pier-frame', 'mar-nautical-dash', 'mar-slip-outline'],
    shapeNames:   ['mar-sailboat', 'mar-yacht', 'mar-anchor', 'mar-lighthouse'],
    accentShapes: ['mar-cleats', 'mar-buoys', 'mar-knots', 'mar-fenders'],
    boardBg:      { pattern: 'solid', color: '#00b4d8' },
  },
  {
    name: 'Train Station', emoji: '🚉',
    palette: {
      bg:     ['#9aa7b2', '#c58458', '#6f8f75'],
      ring:   ['#37474f', '#7a3e1d', '#2f5d3a', '#3f3c8f'],
      shape:  ['#263238', '#82401f', '#315b42'],
      accent: ['#0d47a1', '#7f1d3a', '#4a148c'],
    },
    bgPatterns:   ['trn-platform-lines', 'trn-track-lines', 'trn-timetable-rows', 'trn-canopy-ribs', 'trn-floor-grain'],
    ringStyles:   ['trn-platform-edge', 'trn-window-frame', 'trn-route-border'],
    shapeNames:   ['trn-commuter-train', 'trn-station-clock', 'trn-ticket-machine', 'trn-departure-board'],
    accentShapes: ['trn-signal-lights', 'trn-tickets', 'trn-arrows', 'trn-track-bolts'],
    boardBg:      { pattern: 'solid', color: '#9aa7b2' },
  },
  {
    name: 'Shopping Mall Composition', emoji: '🛍️',
    style: 'graphic-composition',
    palette: {
      bg:     ['#2f7f83', '#b54c63', '#b07a28'],
      ring:   ['#2f5964', '#71395f', '#98502b', '#566b2f'],
      shape:  ['#2457a6', '#a23f45', '#9a6b12'],
      accent: ['#653b9b', '#b23a2a', '#087f8c'],
    },
    bgPatterns:   ['cmpmall-polished-floor-grain', 'cmpmall-skylight-wash', 'cmpmall-glass-seams', 'cmpmall-directory-scan', 'cmpmall-ambient-terrazzo'],
    ringStyles:   ['cmpmall-atrium-axis', 'cmpmall-storefront-bands', 'cmpmall-escalator-level-blocks'],
    shapeNames:   ['cmpmall-terrazzo-speckles', 'cmpmall-floor-tile-grid', 'cmpmall-glass-stripe-rhythm', 'cmpmall-wayfinding-ticks'],
    accentShapes: ['cmpmall-shopping-bag-clusters', 'cmpmall-directional-arrows', 'cmpmall-storefront-tabs', 'cmpmall-food-court-arrangements'],
    boardBg:      { pattern: 'cmpmall-polished-floor-grain', color: '#2f7f83' },
  },
  // Archived August 2026 (active style-balance rotation)
  {
    name: 'Stadium', emoji: '🏟️',
    palette: {
      bg:     ['#00875a', '#2f4eb5', '#c72c41'],
      ring:   ['#004d40', '#1a237e', '#8e1b2f', '#4e342e'],
      shape:  ['#00695c', '#283593', '#9b1c31'],
      accent: ['#6a1b9a', '#e65100', '#37474f'],
    },
    bgPatterns:   ['std-turf-lines', 'std-seat-bands', 'std-score-streaks', 'std-concourse-grid', 'std-field-grain'],
    ringStyles:   ['std-scoreboard-frame', 'std-track-lanes', 'std-ticket-border'],
    shapeNames:   ['std-trophy', 'std-jersey', 'std-scoreboard', 'std-stadium-light'],
    accentShapes: ['std-seat-dots', 'std-flags', 'std-score-pips', 'std-play-arrows'],
    boardBg:      { pattern: 'solid', color: '#00875a' },
  },
  {
    name: 'Stadium Stickers', emoji: '🏷️',
    style: 'bold-sticker',
    palette: {
      bg:     ['#f0642d', '#00a896', '#7b2cbf'],
      ring:   ['#0b5d1e', '#153e75', '#8a1c41', '#5a3a00'],
      shape:  ['#005f73', '#7f1d1d', '#3b2f8f'],
      accent: ['#5b21b6', '#b42318', '#1f4e5f'],
    },
    bgPatterns:   ['stkstd-turf-scuffs', 'stkstd-seat-stitches', 'stkstd-speed-hatch', 'stkstd-ticket-fibers', 'stkstd-scoreboard-scan'],
    ringStyles:   ['stkstd-patch-frame', 'stkstd-varsity-double', 'stkstd-ticket-patch'],
    shapeNames:   ['stkstd-champion-cup', 'stkstd-varsity-jersey', 'stkstd-scoreboard', 'stkstd-foam-finger'],
    accentShapes: ['stkstd-seat-badges', 'stkstd-pennants', 'stkstd-score-tabs', 'stkstd-play-chevrons'],
    boardBg:      { pattern: 'stkstd-speed-hatch', color: '#00a896' },
  },
  // Archived August 2026 (Modern Places rotation)
  {
    name: 'London', emoji: '🎡',
    palette: {
      bg:     ['#c8102e', '#10233f', '#8a99a6'],
      ring:   ['#b00020', '#1a2a4a', '#4a5560', '#6a1b1b'],
      shape:  ['#a3132e', '#16305a', '#3d4650'],
      accent: ['#8b0000', '#274060', '#5c6670'],
    },
    bgPatterns:   ['lon-brick', 'lon-fog', 'lon-tubemap', 'lon-rain', 'lon-unionweave'],
    ringStyles:   ['lon-brickarch', 'lon-railing', 'lon-roundelband'],
    shapeNames:   ['lon-bigben', 'lon-bus', 'lon-phonebox', 'lon-umbrella'],
    accentShapes: ['lon-pips', 'lon-raindrops', 'lon-roundels', 'lon-crowns'],
    boardBg:      { pattern: 'solid', color: '#10233f' },
  },
  {
    name: 'Tokyo', emoji: '⛩️',
    palette: {
      bg:     ['#2b3a67', '#c1272d', '#f4a6c0'],
      ring:   ['#1f2d54', '#a01d22', '#7b3f61', '#2e4a6b'],
      shape:  ['#24325c', '#b0222a', '#8e4585'],
      accent: ['#34406b', '#9c1f26', '#b0567f'],
    },
    bgPatterns:   ['tok-seigaiha', 'tok-ricepaper', 'tok-neon', 'tok-asanoha', 'tok-skyline'],
    ringStyles:   ['tok-lanternband', 'tok-waveborder', 'tok-seigaiarc'],
    shapeNames:   ['tok-torii', 'tok-shinkansen', 'tok-lantern', 'tok-fuji'],
    accentShapes: ['tok-blossoms', 'tok-lanterndots', 'tok-wavecrests', 'tok-koi'],
    boardBg:      { pattern: 'solid', color: '#2b3a67' },
  },
  {
    name: 'Paris', emoji: '🥐',
    palette: {
      bg:     ['#a7c4e0', '#e7a9bf', '#f2e8d5'],
      ring:   ['#34567a', '#a24d68', '#6b4f7a', '#7a5a3c'],
      shape:  ['#3d5f86', '#b05070', '#8a6d3b'],
      accent: ['#4a6b8f', '#9c4a63', '#7a6a4a'],
    },
    bgPatterns:   ['par-ironlattice', 'par-awning', 'par-cobbles', 'par-bokeh', 'par-script'],
    ringStyles:   ['par-ironscroll', 'par-ribbonband', 'par-archframe'],
    shapeNames:   ['par-eiffel', 'par-macaron', 'par-beret', 'par-cafechair'],
    accentShapes: ['par-fleur', 'par-croissantdots', 'par-hearts', 'par-petals'],
    boardBg:      { pattern: 'solid', color: '#a7c4e0' },
  },
  {
    name: 'New York', emoji: '🗽',
    palette: {
      bg:     ['#f2b705', '#37414d', '#9e3b30'],
      ring:   ['#b08600', '#2b2f36', '#7a2a22', '#4a4038'],
      shape:  ['#a37400', '#33373e', '#8f3327'],
      accent: ['#8a6d00', '#40454d', '#6e2b22'],
    },
    bgPatterns:   ['ny-brick', 'ny-checkercab', 'ny-subwaytiles', 'ny-avenues', 'ny-halftone'],
    ringStyles:   ['ny-checkerband', 'ny-fireescape', 'ny-subwayframe'],
    shapeNames:   ['ny-liberty', 'ny-cab', 'ny-skyscraper', 'ny-pretzel'],
    accentShapes: ['ny-tokens', 'ny-checkerdots', 'ny-steam', 'ny-stars'],
    boardBg:      { pattern: 'solid', color: '#37414d' },
  },
  {
    name: 'Amsterdam', emoji: '🚲',
    palette: {
      bg:     ['#e8791e', '#2f6d8c', '#b34a35'],
      ring:   ['#c85a12', '#1f5670', '#8a3524', '#5a4a2e'],
      shape:  ['#b85416', '#23617f', '#9c3f2b'],
      accent: ['#a34a10', '#2a5f7d', '#7a3626'],
    },
    bgPatterns:   ['ams-canalripples', 'ams-rowhouses', 'ams-gableskyline', 'ams-cobbles', 'ams-bunting'],
    ringStyles:   ['ams-gableframe', 'ams-mooring', 'ams-bridgearch'],
    shapeNames:   ['ams-canalhouse', 'ams-bicycle', 'ams-windmill', 'ams-tulip'],
    accentShapes: ['ams-cheese', 'ams-belldots', 'ams-ripples', 'ams-clogs'],
    boardBg:      { pattern: 'solid', color: '#2f6d8c' },
  },
  {
    name: 'Dubai', emoji: '🏙️',
    palette: {
      bg:     ['#d4a017', '#2a8a8a', '#e6c992'],
      ring:   ['#9a7410', '#1f6b6b', '#7a5a1e', '#4a5d3a'],
      shape:  ['#a37c10', '#227575', '#8a6a2a'],
      accent: ['#8a6a12', '#2a7d7d', '#6b5320'],
    },
    bgPatterns:   ['dxb-glassfacade', 'dxb-dunes', 'dxb-lattice', 'dxb-skyline', 'dxb-sand'],
    ringStyles:   ['dxb-mashrabiya', 'dxb-goldband', 'dxb-archframe'],
    shapeNames:   ['dxb-burj', 'dxb-dhow', 'dxb-falcon', 'dxb-palmisland'],
    accentShapes: ['dxb-goldflecks', 'dxb-dunecurves', 'dxb-lanterndots', 'dxb-gems'],
    boardBg:      { pattern: 'solid', color: '#d4a017' },
  },
  // Archived July 2026 (city rotation)
  {
    name: 'Bioluminescent Reef', emoji: '🐠',
    palette: {
      bg:     ['#003049', '#00bcd4', '#ffd166'],
      ring:   ['#e91e63', '#4caf50', '#ff9800', '#2196f3'],
      shape:  ['#e91e63', '#4caf50', '#ff9800'],
      accent: ['#f44336', '#00bcd4', '#e65100'],
    },
    bgPatterns:   ['waves', 'palm-fronds', 'sand-ripples', 'bamboo', 'sunset-gradient'],
    ringStyles:   ['lei', 'rope-twist', 'shell-border'],
    shapeNames:   ['flamingo', 'pineapple', 'hibiscus', 'surfboard'],
    accentShapes: ['coconuts', 'fish', 'waves-mini', 'shells'],
    boardBg: { pattern: 'waves', color: '#003049' },
  },
  {
    name: 'Metro Transit', emoji: '🚇',
    palette: {
      bg:     ['#2f3e46', '#84a98c', '#f4a261'],
      ring:   ['#1a237e', '#1b5e20', '#b71c1c', '#4a148c'],
      shape:  ['#004d40', '#4e342e', '#263238'],
      accent: ['#bf360c', '#006064', '#880e4f'],
    },
    bgPatterns:   ['app-grid', 'status-bar', 'home-screen', 'swipe-trail', 'notification-shade'],
    ringStyles:   ['app-border', 'rounded-badge', 'pill-outline'],
    shapeNames:   ['chat-bubble', 'wifi-icon', 'battery-shape', 'bell-icon'],
    accentShapes: ['app-dot', 'signal-bars-corner', 'toggle-switch', 'pin-badge'],
    boardBg: { pattern: 'solid', color: '#2f3e46' },
  },
  {
    name: 'Solarpunk', emoji: '🌞',
    palette: {
      bg:     ['#b7e36b', '#2ec4b6', '#ff8a65'],
      ring:   ['#0d47a1', '#1b5e20', '#4a148c', '#bf360c'],
      shape:  ['#00695c', '#2e7d32', '#1a237e'],
      accent: ['#ad1457', '#33691e', '#004d40'],
    },
    bgPatterns:   ['grid-lines', 'circuit', 'pixel-blocks', 'laser-beams', 'digital-rain'],
    ringStyles:   ['neon-glow', 'pulse', 'wireframe'],
    shapeNames:   ['lightning', 'pixel-heart', 'pac-ghost', 'controller'],
    accentShapes: ['glitch-dots', 'brackets', 'pixels', 'signal-bars'],
    boardBg: { pattern: 'solid', color: '#2ec4b6' },
  },
  {
    name: 'Fjord Harbor', emoji: '⛵',
    palette: {
      bg:     ['#355c7d', '#e1a95f', '#6b8e23'],
      ring:   ['#1a237e', '#e65100', '#ff7043', '#42a5f5'],
      shape:  ['#1a237e', '#e65100', '#42a5f5'],
      accent: ['#ff7043', '#ef5350', '#1a237e'],
    },
    bgPatterns:   ['sky-gradient', 'fluffy-clouds', 'rainbow-arc', 'cirrus-wisps', 'sunset-glow'],
    ringStyles:   ['cloud-border', 'rainbow-ring', 'breeze-dash'],
    shapeNames:   ['airplane', 'songbird', 'bright-sun', 'kite'],
    accentShapes: ['tiny-birds', 'butterflies', 'raindrops', 'drifting-leaves'],
    boardBg: { pattern: 'sky-gradient', color: '#355c7d' },
  },
  {
    name: 'Retro Kitchen', emoji: '🍳',
    palette: {
      bg:     ['#fff3e0', '#d84315', '#26a69a'],
      ring:   ['#bf360c', '#f57f17', '#1b5e20', '#4e342e'],
      shape:  ['#f57f17', '#1b5e20', '#bf360c'],
      accent: ['#4e342e', '#1b5e20', '#ff6e40'],
    },
    bgPatterns:   ['checkered-tablecloth', 'food-truck-stripe', 'brick-wall', 'napkin-fold', 'grease-paper'],
    ringStyles:   ['pretzel-twist', 'sauce-drizzle', 'chopstick-border'],
    shapeNames:   ['pizza-slice', 'taco', 'boba-cup', 'soft-pretzel'],
    accentShapes: ['sesame-seeds', 'chili-flakes', 'crumbs', 'steam-wisps'],
    boardBg: { pattern: 'checkered-tablecloth', color: '#fff3e0' },
  },
  {
    name: 'Clockwork Workshop', emoji: '🕰️',
    palette: {
      bg:     ['#2f2f2f', '#b8860b', '#5b7c99'],
      ring:   ['#6d4c00', '#0d47a1', '#1b5e20', '#4a148c'],
      shape:  ['#880e4f', '#004d40', '#311b92'],
      accent: ['#3e2723', '#01579b', '#33691e'],
    },
    bgPatterns:   ['velvet-cushion', 'display-case', 'chain-links', 'gem-facets', 'jewel-box'],
    ringStyles:   ['band-ring', 'prong-setting', 'filigree-band'],
    shapeNames:   ['diamond-gem', 'pearl-drop', 'watch-face', 'tiara'],
    accentShapes: ['gem-studs', 'clasp-hooks', 'sparkle-dots', 'tiny-gems'],
    boardBg: { pattern: 'velvet-cushion', color: '#2f2f2f' },
  },
  {
    name: 'Mint Bazaar', emoji: '🧿',
    palette: {
      bg:     ['#2a9d8f', '#7a5cfa', '#f4a261'],
      ring:   ['#2E7D32', '#C2185B', '#1565C0', '#6A1B9A'],
      shape:  ['#43A047', '#E91E63', '#1E88E5'],
      accent: ['#FF6D00', '#00ACC1', '#AB47BC'],
    },
    bgPatterns:   ['checkerboard', 'diagonal', 'hBars', 'vBars', 'solid'],
    ringStyles:   ['solid', 'dashed', 'double'],
    shapeNames:   ['cross', 'flower', 'star', 'diamond'],
    accentShapes: ['circles', 'diamonds', 'squares', 'triangles'],
    boardBg: { pattern: 'checkerboard', color: '#2a9d8f' },
  },
  // Archived July 2026
  {
    name: 'Skyline', emoji: '🏙️',
    palette: {
      bg:     ['#e65100', '#4527a0', '#ffb300'],
      ring:   ['#1a237e', '#880e4f', '#004d40', '#4a148c'],
      shape:  ['#1b5e20', '#0d47a1', '#b71c1c'],
      accent: ['#ad1457', '#00695c', '#263238'],
    },
    bgPatterns:   ['skyline-gradient', 'skyline-haze', 'skyline-reflection', 'skyline-clouds', 'skyline-rays'],
    ringStyles:   ['skyline-steel', 'skyline-glass', 'skyline-concrete'],
    shapeNames:   ['skyline-tower', 'skyline-apartment', 'skyline-dome', 'skyline-spire'],
    accentShapes: ['skyline-windows', 'skyline-antenna', 'skyline-lights', 'skyline-vents'],
    boardBg: { pattern: 'solid', color: '#4527a0' },
  },
  {
    name: 'Dusk', emoji: '🌆',
    palette: {
      bg:     ['#0d2137', '#e91e63', '#00838f'],
      ring:   ['#b71c1c', '#1a237e', '#6a1b9a', '#e65100'],
      shape:  ['#c62828', '#1a237e', '#1b5e20'],
      accent: ['#bf360c', '#4a148c', '#0d47a1'],
    },
    bgPatterns:   ['dusk-horizon', 'dusk-mist', 'dusk-streaks', 'dusk-haze', 'dusk-glow'],
    ringStyles:   ['dusk-railing', 'dusk-neon', 'dusk-fire-escape'],
    shapeNames:   ['dusk-watertower', 'dusk-brownstone', 'dusk-bridge', 'dusk-clocktower'],
    accentShapes: ['dusk-litwindow', 'dusk-lamppost', 'dusk-stars', 'dusk-sparks'],
    boardBg: { pattern: 'solid', color: '#0d2137' },
  },
  {
    name: 'Medina', emoji: '🕌',
    palette: {
      bg:     ['#bf360c', '#00695c', '#f9a825'],
      ring:   ['#1a237e', '#b71c1c', '#311b92', '#880e4f'],
      shape:  ['#263238', '#1a237e', '#ad1457'],
      accent: ['#1b5e20', '#6a1b9a', '#0d47a1'],
    },
    bgPatterns:   ['medina-mosaic', 'medina-lattice', 'medina-archway', 'medina-plaster', 'medina-tile'],
    ringStyles:   ['medina-horseshoe', 'medina-carved', 'medina-zellige'],
    shapeNames:   ['medina-minaret', 'medina-arch', 'medina-riad', 'medina-dome'],
    accentShapes: ['medina-lantern', 'medina-star', 'medina-crescent', 'medina-rosette'],
    boardBg: { pattern: 'solid', color: '#bf360c' },
  },
  {
    name: 'Volt', emoji: '⚡',
    palette: {
      bg:     ['#7c4dff', '#00e676', '#f50057'],
      ring:   ['#1a237e', '#004d40', '#b71c1c', '#311b92'],
      shape:  ['#263238', '#4a148c', '#006064'],
      accent: ['#1b5e20', '#880e4f', '#0d47a1'],
    },
    bgPatterns:   ['volt-circuit', 'volt-pulse', 'volt-grid', 'volt-static', 'volt-surge'],
    ringStyles:   ['volt-trace', 'volt-arc', 'volt-coil'],
    shapeNames:   ['volt-bolt', 'volt-chip', 'volt-cell', 'volt-plug'],
    accentShapes: ['volt-sparks', 'volt-pixels', 'volt-pulses', 'volt-nodes'],
    boardBg: { pattern: 'solid', color: '#7c4dff' },
  },
  {
    name: 'Glacier', emoji: '🧊',
    palette: {
      bg:     ['#0277bd', '#00c853', '#6a1b9a'],
      ring:   ['#1a237e', '#b71c1c', '#004d40', '#311b92'],
      shape:  ['#263238', '#1a237e', '#4a148c'],
      accent: ['#bf360c', '#00695c', '#880e4f'],
    },
    bgPatterns:   ['glacier-cracks', 'glacier-layers', 'glacier-facets', 'glacier-drift', 'glacier-shimmer'],
    ringStyles:   ['glacier-frost', 'glacier-crystal', 'glacier-rime'],
    shapeNames:   ['glacier-peak', 'glacier-shard', 'glacier-berg', 'glacier-igloo'],
    accentShapes: ['glacier-flakes', 'glacier-chips', 'glacier-aurora', 'glacier-dots'],
    boardBg: { pattern: 'solid', color: '#0277bd' },
  },
  {
    name: 'Hanami', emoji: '🌸',
    palette: {
      bg:     ['#f8bbd0', '#81c784', '#b39ddb'],
      ring:   ['#1a237e', '#880e4f', '#004d40', '#4a148c'],
      shape:  ['#b71c1c', '#1b5e20', '#4a148c'],
      accent: ['#ad1457', '#00695c', '#311b92'],
    },
    bgPatterns:   ['hanami-petals', 'hanami-branches', 'hanami-ripple', 'hanami-breeze', 'hanami-canopy'],
    ringStyles:   ['hanami-bamboo', 'hanami-silk', 'hanami-wave'],
    shapeNames:   ['hanami-blossom', 'hanami-torii', 'hanami-lantern', 'hanami-koi'],
    accentShapes: ['hanami-falling', 'hanami-dewdrops', 'hanami-buds', 'hanami-fireflies'],
    boardBg: { pattern: 'solid', color: '#f8bbd0' },
  },

  // Archived May 2026
  {
    name: 'Circus', emoji: '🎪',
    palette: {
      bg:     ['#e53935', '#fdd835', '#42a5f5'],
      ring:   ['#b71c1c', '#e65100', '#1b5e20', '#4a148c'],
      shape:  ['#d84315', '#1a237e', '#2e7d32'],
      accent: ['#004d40', '#ad1457', '#0d47a1'],
    },
    bgPatterns:   ['big-top-stripes', 'circus-banner', 'sawdust', 'tent-canvas', 'ticket-stub'],
    ringStyles:   ['ticket-edge', 'bunting-border', 'circus-rope'],
    shapeNames:   ['circus-tent', 'juggling-pins', 'cannon', 'trapeze'],
    accentShapes: ['popcorn-kernels', 'confetti-bits', 'star-badges', 'balloon-dots'],
    boardBg: { pattern: 'big-top-stripes', color: '#b71c1c' },
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
    name: 'Luau', emoji: '🌺',
    palette: {
      bg:     ['#ff7043', '#26a69a', '#ffee58'],
      ring:   ['#b71c1c', '#00695c', '#e65100', '#1a237e'],
      shape:  ['#004d40', '#880e4f', '#33691e'],
      accent: ['#bf360c', '#006064', '#4a148c'],
    },
    bgPatterns:   ['luau-palms', 'tiki-torch', 'ocean-waves', 'bamboo-fence', 'lei-garland'],
    ringStyles:   ['rope-braid', 'bamboo-frame', 'flower-lei'],
    shapeNames:   ['luau-hibiscus', 'tiki-mask', 'luau-pineapple', 'luau-surfboard'],
    accentShapes: ['plumeria-petals', 'sea-shells', 'coconut-halves', 'fish-hooks'],
    boardBg: { pattern: 'solid', color: '#00bcd4' },
  },
  {
    name: 'Origami', emoji: '🦢',
    palette: {
      bg:     ['#ffab91', '#b0bec5', '#ffe082'],
      ring:   ['#b71c1c', '#1a237e', '#004d40', '#4a148c'],
      shape:  ['#c62828', '#0d47a1', '#00695c'],
      accent: ['#bf360c', '#283593', '#1b5e20'],
    },
    bgPatterns:   ['washi-texture', 'fold-grid', 'paper-grain', 'crease-lines', 'tatami'],
    ringStyles:   ['mountain-fold', 'valley-fold', 'pleated'],
    shapeNames:   ['crane', 'boat', 'fox-face', 'fortune-teller'],
    accentShapes: ['crease-marks', 'paper-corners', 'fold-tabs', 'origami-stars'],
    boardBg: { pattern: 'solid', color: '#ffe0b2' },
  },
  {
    name: 'Apothecary', emoji: '🧪',
    palette: {
      bg:     ['#ce93d8', '#a1887f', '#ffb74d'],
      ring:   ['#311b92', '#006064', '#bf360c', '#880e4f'],
      shape:  ['#4a148c', '#004d40', '#e65100'],
      accent: ['#6a1b9a', '#00695c', '#d84315'],
    },
    bgPatterns:   ['stone-shelf', 'herb-wall', 'alchemy-symbols', 'cobweb', 'apothecary-jars'],
    ringStyles:   ['herb-wrap', 'wax-seal-ring', 'smoke-wisp'],
    shapeNames:   ['potion-bottle', 'mortar-pestle', 'flask-shape', 'cauldron'],
    accentShapes: ['herb-sprigs', 'droplets', 'crystal-shards', 'rune-marks'],
    boardBg: { pattern: 'solid', color: '#4e342e' },
  },
  {
    name: 'Laundry', emoji: '🧺',
    palette: {
      bg:     ['#f8bbd0', '#81d4fa', '#a5d6a7'],
      ring:   ['#0d47a1', '#004d40', '#4a148c', '#3e2723'],
      shape:  ['#1a237e', '#006064', '#4e342e'],
      accent: ['#311b92', '#01579b', '#33691e'],
    },
    bgPatterns:   ['clothesline', 'fabric-weave', 'tumble-dry', 'soap-suds', 'laundry-basket'],
    ringStyles:   ['stitched', 'hemline', 'fold-crease'],
    shapeNames:   ['sock-shape', 'hanger', 'clothespin', 'iron-shape'],
    accentShapes: ['buttons', 'safety-pins', 'lint-balls', 'thread-spools'],
    boardBg: { pattern: 'solid', color: '#f8bbd0' },
  },
  {
    name: 'Jeweler', emoji: '💎',
    palette: {
      bg:     ['#ef5350', '#7e57c2', '#ffd54f'],
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
    name: 'Arctic', emoji: '❄️',
    palette: {
      bg:     ['#1565c0', '#e1f5fe', '#b39ddb'],
      ring:   ['#0d47a1', '#00838f', '#6a1b9a', '#1b5e20'],
      shape:  ['#0d47a1', '#c62828', '#1b5e20'],
      accent: ['#0d47a1', '#4a148c', '#00695c'],
    },
    bgPatterns:   ['ice-crystals', 'snowfall', 'frozen-lake', 'blizzard-wind', 'arctic-layers'],
    ringStyles:   ['frost-border', 'icicle-ring', 'snowdrift-edge'],
    shapeNames:   ['snowflake', 'penguin', 'igloo', 'polar-bear'],
    accentShapes: ['ice-shards', 'snowflakes-tiny', 'frost-dots', 'icicle-drops'],
    boardBg: { pattern: 'ice-crystals', color: '#1565c0' },
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
