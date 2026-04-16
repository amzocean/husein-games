// photos.js — Load photos from photos/ folder via manifest

const PHOTO_DIR = 'photos/';
let photoList = null;

// Load the photo list from photos/manifest.json
// manifest.json is just an array of filenames: ["pic1.jpg", "pic2.jpg", ...]
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

// Get a random photo URL (relative path)
async function getRandomPhotoURL() {
  const list = await loadManifest();
  if (list.length === 0) return null;
  const file = list[Math.floor(Math.random() * list.length)];
  return PHOTO_DIR + file;
}

export { getRandomPhotoURL };
