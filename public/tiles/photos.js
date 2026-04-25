// photos.js — Daily photo reveal from photos/ folder via manifest
// One photo per calendar day, sequential, no skips, with usage log

const PHOTO_DIR = 'photos/';
let photoList = null;

async function loadManifest() {
  if (photoList !== null) return photoList;
  try {
    const resp = await fetch(PHOTO_DIR + 'manifest.json');
    if (!resp.ok) { photoList = []; return photoList; }
    photoList = await resp.json();
  } catch {
    photoList = [];
  }
  return photoList;
}

// Usage log: { "photo-01.jpg": ["2026-04-24", "2026-06-25"], ... }
function getUsageLog() {
  try { return JSON.parse(localStorage.getItem('tiles_photo_log') || '{}'); }
  catch { return {}; }
}

function logUsage(filename, date) {
  const log = getUsageLog();
  if (!log[filename]) log[filename] = [];
  if (!log[filename].includes(date)) log[filename].push(date);
  localStorage.setItem('tiles_photo_log', JSON.stringify(log));
}

// Returns one photo per calendar day, advancing sequentially only on days
// someone actually plays. Skipped days don't skip photos.
async function getDailyPhotoURL() {
  const list = await loadManifest();
  if (list.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const lastDate = localStorage.getItem('tiles_photo_date');
  let index = parseInt(localStorage.getItem('tiles_photo_index') ?? '0', 10);

  if (lastDate === today) {
    // Same day — show same photo
  } else if (lastDate) {
    // New day — advance to next photo
    index = (index + 1) % list.length;
  }
  // else first ever play — start at 0

  localStorage.setItem('tiles_photo_date', today);
  localStorage.setItem('tiles_photo_index', String(index));
  logUsage(list[index], today);

  return PHOTO_DIR + list[index];
}

// Get photo usage stats for review
// Returns: { used: [{file, dates, count}], unused: [file] }
async function getPhotoStats() {
  const list = await loadManifest();
  const log = getUsageLog();
  const used = [], unused = [];
  for (const file of list) {
    if (log[file] && log[file].length > 0) {
      used.push({ file, dates: log[file], count: log[file].length });
    } else {
      unused.push(file);
    }
  }
  used.sort((a, b) => b.count - a.count);
  return { used, unused, total: list.length };
}

export { getDailyPhotoURL, getPhotoStats };
