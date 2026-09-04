// Curated prompt builder for the Birthday Image Studio.
// There is no freeform prompt field — only these vetted choices, plus a short
// optional note that gets sanitized and folded into the fixed template below.
'use strict';

const STYLES = {
  storybook: {
    label: 'Cute romantic storybook',
    desc: 'a cute romantic storybook illustration with soft warm colors, gentle whimsical linework, and a fairy-tale picture-book feel',
  },
  chibi: {
    label: 'Colorful chibi stickers',
    desc: 'a colorful chibi-style sticker illustration with big sparkling eyes, playful bold outlines, and a cheerful sticker-sheet look',
  },
  soft3d: {
    label: 'Soft 3D animated celebration',
    desc: 'a soft 3D animated celebration render with warm rounded shapes, gentle studio lighting, and a friendly animated-film look',
  },
  watercolor: {
    label: 'Dreamy watercolor',
    desc: 'a dreamy watercolor painting with soft bleeding edges, gentle pastel washes, and light textured paper grain',
  },
};

const SCENARIOS = {
  breakfast: {
    label: 'Birthday breakfast',
    desc: 'a cozy birthday breakfast scene with pastries, warm morning light, and a small decorated table',
  },
  garden: {
    label: 'Enchanted garden',
    desc: 'an enchanted garden full of blooming flowers, soft magical light, and gentle floating petals',
  },
  balloons: {
    label: 'Balloon festival',
    desc: 'a joyful balloon festival with colorful balloons filling the sky and streamers in the breeze',
  },
  travel: {
    label: 'Dreamy travel',
    desc: 'a dreamy travel-adventure scene with a whimsical, charming destination backdrop (like a storybook city or scenic vista)',
  },
  rooftop: {
    label: 'Starlit rooftop',
    desc: 'a starlit rooftop celebration under a glowing night sky with soft string lights',
  },
  cozy: {
    label: 'Cozy celebration',
    desc: 'a cozy warm indoor celebration with soft string lights, comfortable seating, and a relaxed happy mood',
  },
};

const SUBJECT_MODES = {
  fatema: {
    label: 'Fatema solo',
    desc: 'Feature Fatema alone as the sole joyful subject of the scene.',
  },
  both: {
    label: 'Both together',
    desc: 'Feature both Husein and Fatema together in the scene, close and affectionate with each other.',
  },
  auto: {
    label: 'Follow references',
    desc: 'Let the number and identity of people follow naturally from whoever appears in the provided reference photos.',
  },
};

const DETAILS = {
  flowers: 'delicate flowers',
  balloons: 'colorful balloons',
  hearts: 'soft heart motifs',
  cake: 'a decorated birthday cake',
  sparkles: 'gentle sparkles and light glimmer',
  crown: 'a small birthday crown or tiara',
  confetti: 'floating confetti',
  gifts: 'a few wrapped gift boxes',
};

const MAX_NOTE_LENGTH = 200;
// Strip anything that isn't a common printable character to keep the note
// simple text that folds safely into the template (no prompt-injection style
// control sequences, no unicode direction tricks, etc.).
const NOTE_SANITIZE_PATTERN = /[^a-zA-Z0-9 .,!'"()&+-]/g;

function listOptions() {
  const toList = (obj) => Object.entries(obj).map(([key, v]) => ({ key, label: v.label }));
  return {
    styles: toList(STYLES),
    scenarios: toList(SCENARIOS),
    subjectModes: toList(SUBJECT_MODES),
    details: Object.keys(DETAILS).map((key) => ({ key, label: DETAILS[key].replace(/^./, (c) => c.toUpperCase()) })),
  };
}

function sanitizeNote(note) {
  if (!note) return '';
  const cleaned = String(note).replace(NOTE_SANITIZE_PATTERN, '').trim();
  return cleaned.slice(0, MAX_NOTE_LENGTH);
}

/**
 * Build the final image-generation prompt from curated selections only.
 * Throws on any unknown key so bad input never silently falls through.
 */
function buildPrompt({ style, scenario, subjectMode, details, note, referenceCount }) {
  if (!STYLES[style]) throw new Error(`Unknown style: ${JSON.stringify(style)}`);
  if (!SCENARIOS[scenario]) throw new Error(`Unknown scenario: ${JSON.stringify(scenario)}`);
  if (!SUBJECT_MODES[subjectMode]) throw new Error(`Unknown subjectMode: ${JSON.stringify(subjectMode)}`);

  const detailKeys = Array.isArray(details) ? details : [];
  const unknownDetail = detailKeys.find((d) => !DETAILS[d]);
  if (unknownDetail) throw new Error(`Unknown detail: ${JSON.stringify(unknownDetail)}`);

  const detailPhrase = detailKeys.length
    ? `Include tasteful uplifting touches such as ${detailKeys.map((d) => DETAILS[d]).join(', ')}.`
    : '';

  const cleanNote = sanitizeNote(note);
  const notePhrase = cleanNote
    ? `Additional uplifting note from the requester (keep it joyful and tasteful): ${cleanNote}.`
    : '';

  const refPhrase = referenceCount > 0
    ? `Use the ${referenceCount} attached reference photo${referenceCount === 1 ? '' : 's'} as the ground truth for identity.`
    : '';

  const parts = [
    `Create ${STYLES[style].desc} depicting ${SCENARIOS[scenario].desc}.`,
    SUBJECT_MODES[subjectMode].desc,
    refPhrase,
    'The subject(s) must have recognizable, consistent faces closely matching the provided reference photos, with flattering, kind expressions and a joyful, warm celebratory mood.',
    'The composition should be tasteful, wholesome, and romantic/cute in a way appropriate for a birthday keepsake.',
    detailPhrase,
    notePhrase,
    'Do not include any text, captions, watermarks, or logos in the image.',
    'Avoid distorted anatomy, extra or missing limbs, or unnatural proportions.',
    'Do not depict sadness, darkness, horror themes, violence, or embarrassing situations — the mood must stay bright, warm, and celebratory throughout.',
  ].filter(Boolean);

  return parts.join(' ');
}

module.exports = {
  STYLES,
  SCENARIOS,
  SUBJECT_MODES,
  DETAILS,
  MAX_NOTE_LENGTH,
  listOptions,
  sanitizeNote,
  buildPrompt,
};
