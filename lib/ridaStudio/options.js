// Curated, allowlisted options for Fatema's Rida Studio.
// The browser sends the short "key" for each choice below. Optional panel,
// lace, and embroidery notes are separately length-limited and sanitized by
// promptBuilder.js; the core prompt remains server-controlled.
'use strict';

// Palette/color combinations — bright, romantic, and elegant.
const COLORS = {
  rosePearl: {
    label: 'Blush Rose & Pearl',
    swatch: ['#f7cad0', '#fff8f0'],
    desc: 'a blush rose-pink and pearl-white color palette',
  },
  royalGold: {
    label: 'Royal Blue & Gold',
    swatch: ['#1e3a8a', '#f5c518'],
    desc: 'a royal blue and gold color palette',
  },
  emeraldIvory: {
    label: 'Emerald & Ivory',
    swatch: ['#0f766e', '#fffdf0'],
    desc: 'an emerald green and ivory color palette',
  },
  lavenderSilver: {
    label: 'Lavender & Silver',
    swatch: ['#c4b5fd', '#e5e7eb'],
    desc: 'a soft lavender and silver color palette',
  },
  coralPeach: {
    label: 'Coral & Peach',
    swatch: ['#ff8a65', '#ffd3b0'],
    desc: 'a warm coral and peach color palette',
  },
  tealMaroon: {
    label: 'Teal & Maroon',
    swatch: ['#0d9488', '#7f1d1d'],
    desc: 'a rich teal and deep maroon color palette',
  },
};

// Pattern/motif on the fabric.
const MOTIFS = {
  floralVines: {
    label: 'Floral Vines',
    icon: '🌿',
    desc: 'delicate floral vine patterns trailing gracefully across the fabric',
  },
  tinyBlossoms: {
    label: 'Tiny Blossoms',
    icon: '🌸',
    desc: 'an all-over print of tiny, dainty blossom flowers',
  },
  geometric: {
    label: 'Tasteful Geometric',
    icon: '◆',
    desc: 'a tasteful, refined geometric pattern',
  },
  scalloped: {
    label: 'Scalloped Edges',
    icon: '〰️',
    desc: 'gentle scalloped-edge patterning throughout',
  },
  embroideredFloral: {
    label: 'Embroidered Floral',
    icon: '🧵',
    desc: 'an embroidered-style floral motif',
  },
};

// Nehl / border treatment.
const BORDERS = {
  none: {
    label: 'No Lace',
    icon: '○',
    desc: 'no lace or nehl trim',
  },
  pearlLace: {
    label: 'Pearl Lace Nehl',
    icon: '🤍',
    desc: 'a delicate pearl lace border (nehl) trim',
  },
  contrastTrim: {
    label: 'Contrast Trim',
    icon: '➖',
    desc: 'a crisp contrast-color border trim',
  },
  floralEmbroideryBorder: {
    label: 'Floral Embroidery Border',
    icon: '🌺',
    desc: 'a floral embroidered border (nehl)',
  },
  festiveGold: {
    label: 'Festive Gold Border',
    icon: '✨',
    desc: 'a festive gold-thread border (nehl)',
  },
  beadedEdge: {
    label: 'Beaded Edge',
    icon: '📿',
    desc: 'a delicately beaded border edge',
  },
};

// Decorative panel around the lower portion of the ghagra.
const PANELS = {
  none: {
    label: 'No Panel',
    icon: '○',
    desc: 'no separate decorative panel',
  },
  coordinatedWide: {
    label: 'Wide Coordinated Panel',
    icon: '▰',
    desc: 'a wide coordinated fabric panel around the lower quarter of the ghagra',
  },
  contrastPanel: {
    label: 'Contrast Color Panel',
    icon: '◫',
    desc: 'a distinct contrast-color panel around the lower portion of the ghagra',
  },
  scallopedPanel: {
    label: 'Scalloped Panel',
    icon: '〰️',
    desc: 'a graceful scalloped lower panel following the circumference of the ghagra',
  },
  layeredPanel: {
    label: 'Layered Festive Panel',
    icon: '✨',
    desc: 'an elegant layered festive panel with coordinated fabric bands near the ghagra hem',
  },
  subtlePanel: {
    label: 'Subtle Narrow Panel',
    icon: '➖',
    desc: 'a narrow, understated coordinated panel near the bottom of the ghagra',
  },
};

// Photography treatment. Every option remains photorealistic so the chosen
// setting never overrides Fatema's real facial identity.
const STYLES = {
  storybook: {
    label: 'Natural Portrait',
    icon: '📷',
    desc: 'a high-resolution natural lifestyle photograph with realistic skin texture, flattering soft daylight, and true-to-life facial features',
  },
  chibi: {
    label: 'Bright Travel Photo',
    icon: '☀️',
    desc: 'a vibrant professional travel photograph with realistic proportions, crisp natural detail, and cheerful daylight color',
  },
  soft3d: {
    label: 'Cinematic Portrait',
    icon: '🎬',
    desc: 'a photorealistic cinematic portrait with natural facial detail, elegant depth of field, and warm film-like lighting',
  },
  watercolor: {
    label: 'Soft Editorial Photo',
    icon: '🌷',
    desc: 'a polished photorealistic editorial photograph with soft romantic lighting, realistic skin and fabric, and subtle color grading',
  },
};

// Cheerful locations.
const LOCATIONS = {
  parisCafe: {
    label: 'Paris Café',
    icon: '🥐',
    desc: 'a charming Paris café street scene with little round tables and soft morning light',
  },
  cappadociaBalloons: {
    label: 'Cappadocia Balloons',
    icon: '🎈',
    desc: 'a dreamy Cappadocia sunrise scene with colorful hot air balloons filling the sky',
  },
  swissLake: {
    label: 'Swiss Lake',
    icon: '🏔️',
    desc: 'a serene Swiss lake scene with alpine mountains and crystal-clear water',
  },
  kashmirGarden: {
    label: 'Kashmir Garden',
    icon: '🌷',
    desc: 'a lush Kashmir garden scene with blooming flowerbeds and gentle mountain light',
  },
  santoriniSunset: {
    label: 'Santorini Sunset',
    icon: '🌅',
    desc: 'a golden Santorini sunset scene with white-and-blue buildings overlooking the sea',
  },
  starlitRooftop: {
    label: 'Starlit Rooftop',
    icon: '⭐',
    desc: 'a cozy starlit rooftop scene with soft string lights under a glowing night sky',
  },
};

const CATEGORIES = {
  color: COLORS,
  motif: MOTIFS,
  border: BORDERS,
  panel: PANELS,
  style: STYLES,
  location: LOCATIONS,
};

/** List every category's options as { key, label, icon?, swatch? } for the UI. */
function listOptions() {
  const toList = (obj) => Object.entries(obj).map(([key, v]) => ({
    key,
    label: v.label,
    ...(v.icon ? { icon: v.icon } : {}),
    ...(v.swatch ? { swatch: v.swatch } : {}),
  }));
  return {
    colors: toList(COLORS),
    motifs: toList(MOTIFS),
    borders: toList(BORDERS),
    panels: toList(PANELS),
    styles: toList(STYLES),
    locations: toList(LOCATIONS),
  };
}

/** Validate a full selections object; returns an array of error strings (empty = valid). */
function validateSelections(selections) {
  const errors = [];
  if (!selections || typeof selections !== 'object') {
    return ['Selections must be an object.'];
  }
  for (const [field, catalog] of Object.entries(CATEGORIES)) {
    const value = selections[field];
    if (typeof value !== 'string' || !catalog[value]) {
      errors.push(`Unknown or missing ${field}: ${JSON.stringify(value)}`);
    }
  }
  return errors;
}

module.exports = {
  COLORS,
  MOTIFS,
  BORDERS,
  PANELS,
  STYLES,
  LOCATIONS,
  CATEGORIES,
  listOptions,
  validateSelections,
};
