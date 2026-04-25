// photos.js — Daily photo reveal from photos/ folder via manifest
// One photo per calendar day (cycles when list exhausts)

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

// Returns the same photo for the entire calendar day, cycles through list
async function getDailyPhotoURL() {
  const list = await loadManifest();
  if (list.length === 0) return null;
  const now = new Date();
  // Day index: days since epoch (UTC) so everyone sees the same photo
  const dayIndex = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const file = list[dayIndex % list.length];
  return PHOTO_DIR + file;
}

export { getDailyPhotoURL };
