// photos.js — Daily photo reveal via server-side tracking
// Server assigns one photo per local calendar date, only advancing when played.

const PHOTO_DIR = 'photos/';

// Get today's photo from server (uses client's local date)
async function getDailyPhotoURL() {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  try {
    const resp = await fetch(`/api/tiles/photo?date=${today}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.photo) return null;
    return PHOTO_DIR + data.photo;
  } catch {
    // Fallback: if server unreachable, use localStorage as before
    return fallbackLocalPhoto(today);
  }
}

// Fallback for offline/unreachable server
function fallbackLocalPhoto(today) {
  try {
    const lastDate = localStorage.getItem('tiles_photo_date');
    let index = parseInt(localStorage.getItem('tiles_photo_index') ?? '6', 10);
    if (lastDate !== today && lastDate) {
      index = index + 1;
    }
    localStorage.setItem('tiles_photo_date', today);
    localStorage.setItem('tiles_photo_index', String(index));
    return PHOTO_DIR + `photo-${String(index + 1).padStart(2, '0')}.jpg`;
  } catch {
    return null;
  }
}

// Get photo usage stats (reads server state)
async function getPhotoStats() {
  // Simple version — just report from manifest
  try {
    const resp = await fetch(PHOTO_DIR + 'manifest.json');
    if (!resp.ok) return { used: [], unused: [], total: 0 };
    const list = await resp.json();
    return { used: [], unused: list, total: list.length };
  } catch {
    return { used: [], unused: [], total: 0 };
  }
}

export { getDailyPhotoURL, getPhotoStats };
