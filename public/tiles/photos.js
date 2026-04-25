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

  return PHOTO_DIR + list[index];
}

export { getDailyPhotoURL };
