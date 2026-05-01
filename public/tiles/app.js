// app.js — Main application controller for Fatema Tiles

import { GameState } from './engine.js';
import { renderBoard, updateTileSVG } from './renderer.js';
import { getDailyPhotoURL, getPhotoStats } from './photos.js';

// Expose stats to browser console: await photoStats()
window.photoStats = async () => {
  const s = await getPhotoStats();
  console.log(`📸 Photos: ${s.used.length} used, ${s.unused.length} unused (${s.total} total)`);
  if (s.used.length) { console.table(s.used.map(u => ({ photo: u.file, times: u.count, dates: u.dates.join(', ') }))); }
  if (s.unused.length) { console.log('Unused:', s.unused.join(', ')); }
  return s;
};

// DOM references
const boardEl = document.getElementById('board');
const comboEl = document.getElementById('current-combo');
const bestEl = document.getElementById('longest-combo');
const clearedEl = document.getElementById('tiles-cleared');
const winBanner = document.getElementById('win-banner');
const btnNewGame = document.getElementById('btn-new-game');
const themeToast = document.getElementById('theme-toast');

// Game state
const game = new GameState();
let isProcessing = false; // Prevent rapid taps during animations
let pendingPhotoURL = null; // Defer photo load until first click
let photoLoaded = false;

// ============ Game Flow ============

async function startNewGame() {
  // Hide win banner and clean up any leftover hearts
  winBanner.classList.remove('visible');
  winBanner.textContent = '';
  document.querySelectorAll('.falling-heart').forEach(h => h.remove());

  // Clear any previous photo
  boardEl.style.backgroundImage = 'none';

  // Pick a random photo but don't apply it yet
  pendingPhotoURL = await getDailyPhotoURL();
  photoLoaded = false;

  // Generate and render new board
  const board = game.newGame();
  renderBoard(board, boardEl);

  // Show theme name briefly
  if (board.theme) {
    themeToast.textContent = `${board.theme.emoji} ${board.theme.name}`;
    themeToast.classList.add('visible');
    setTimeout(() => themeToast.classList.remove('visible'), 2000);
  }

  // Update score display
  updateScoreDisplay();

  // Attach tile click handlers (click works on touch too) — skip center tile
  boardEl.querySelectorAll('.tile:not(.center-tile)').forEach(tileEl => {
    tileEl.addEventListener('click', () => handleTileSelect(tileEl));
  });
}

function updateScoreDisplay() {
  comboEl.textContent = game.currentCombo;
  bestEl.textContent = game.longestCombo;
  clearedEl.textContent = `${game.tilesCleared}/${game.totalTiles}`;
}

function handleTileSelect(tileEl) {
  if (isProcessing) return;

  // Load photo behind tiles on first interaction
  if (!photoLoaded && pendingPhotoURL) {
    boardEl.style.backgroundImage = `url(${pendingPhotoURL})`;
    photoLoaded = true;
  }

  const index = parseInt(tileEl.dataset.tileIndex);
  const result = game.selectTile(index);

  switch (result.action) {
    case 'selected':
      tileEl.classList.add('selected');
      break;

    case 'deselected':
      tileEl.classList.remove('selected');
      break;

    case 'no-match':
      handleNoMatch(result);
      break;

    case 'match':
      handleMatch(result);
      break;

    case 'invalid':
      break;
  }
}

function handleNoMatch(result) {
  isProcessing = true;
  const tile1El = boardEl.querySelector(`[data-tile-index="${result.tile1Index}"]`);
  const tile2El = boardEl.querySelector(`[data-tile-index="${result.tile2Index}"]`);

  // Clear all selections visually
  boardEl.querySelectorAll('.tile.selected').forEach(el => el.classList.remove('selected'));

  tile1El.classList.add('no-match-flash');
  tile2El.classList.add('no-match-flash');

  updateScoreDisplay();

  setTimeout(() => {
    tile1El.classList.remove('no-match-flash');
    tile2El.classList.remove('no-match-flash');
    isProcessing = false;
  }, 500);
}

function handleMatch(result) {
  isProcessing = true;
  const tile1El = boardEl.querySelector(`[data-tile-index="${result.tile1Index}"]`);
  const tile2El = boardEl.querySelector(`[data-tile-index="${result.tile2Index}"]`);

  // Clear old selection, show match flash on both
  boardEl.querySelectorAll('.tile.selected').forEach(el => el.classList.remove('selected'));
  tile1El.classList.add('match-flash');
  tile2El.classList.add('match-flash');

  // Animate attribute removal
  updateTileSVG(tile1El.querySelector('.tile-svg'), null, result.shared);
  updateTileSVG(tile2El.querySelector('.tile-svg'), null, result.shared);

  updateScoreDisplay();

  setTimeout(() => {
    tile1El.classList.remove('match-flash');
    tile2El.classList.remove('match-flash');

    // Clear tiles if fully emptied
    if (result.tile1Cleared) tile1El.classList.add('cleared');
    if (result.tile2Cleared) tile2El.classList.add('cleared');

    // Streak: tile2 stays selected if not cleared (engine already set selectedTile)
    if (!result.tile2Cleared) {
      tile2El.classList.add('selected');
    }

    // Check for win
    if (result.isWin) {
      setTimeout(() => showWin(), 600);
    }

    isProcessing = false;
  }, 500);
}

function showWin() {
  // Animate center heart out to reveal photo underneath
  const centerTile = boardEl.querySelector('.center-tile');
  if (centerTile) centerTile.classList.add('win-reveal');

  // Play romantic jigsaw cascade, then show banner
  playCascadeReveal(() => {
    winBanner.textContent = `\u{1F495} Revealed in ${game.moveCount} moves!`;
    winBanner.classList.add('visible');
    spawnHearts();
    showVoiceNoteButton();
  });
}

// Romantic jigsaw cascade — photo pieces fly in from random positions and assemble
function playCascadeReveal(onComplete) {
  if (!pendingPhotoURL) { onComplete(); return; }

  const rect = boardEl.getBoundingClientRect();
  const cols = 5, rows = 5;
  const pieceW = rect.width / cols;
  const pieceH = rect.height / rows;

  // Hide the CSS background so pieces do the reveal
  boardEl.style.backgroundImage = 'none';

  // Build pieces in random order for staggered arrival
  const indices = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      indices.push({ r, c });

  // Shuffle for random cascade order
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const overlay = document.createElement('div');
  overlay.className = 'cascade-overlay';
  overlay.style.cssText = `
    position: absolute; inset: 0; z-index: 10;
    border-radius: var(--radius-md); overflow: hidden;
    pointer-events: none;
  `;
  boardEl.style.position = 'relative';
  boardEl.appendChild(overlay);

  indices.forEach(({ r, c }, i) => {
    const piece = document.createElement('div');
    piece.className = 'cascade-piece';

    // Final resting position
    const finalX = c * pieceW;
    const finalY = r * pieceH;

    // Random start: scattered around the board with rotation
    const startX = finalX + (Math.random() - 0.5) * rect.width * 1.2;
    const startY = finalY + (Math.random() - 0.5) * rect.height * 1.2;
    const startRot = (Math.random() - 0.5) * 120; // ±60°
    const startScale = 0.3 + Math.random() * 0.4;

    piece.style.cssText = `
      position: absolute;
      width: ${pieceW + 1}px;
      height: ${pieceH + 1}px;
      background-image: url(${pendingPhotoURL});
      background-size: ${rect.width}px ${rect.height}px;
      background-position: -${c * pieceW}px -${r * pieceH}px;
      transform: translate(${startX}px, ${startY}px) rotate(${startRot}deg) scale(${startScale});
      opacity: 0;
      transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
                  opacity 0.5s ease;
      transition-delay: ${i * 0.07}s;
      border-radius: 3px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;

    overlay.appendChild(piece);

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        piece.style.transform = `translate(${finalX}px, ${finalY}px) rotate(0deg) scale(1)`;
        piece.style.opacity = '1';
      });
    });
  });

  // After cascade completes, restore photo background and clean up
  const totalTime = indices.length * 70 + 900;
  setTimeout(() => {
    // Soft glow pulse on completion
    overlay.style.transition = 'box-shadow 0.6s ease';
    overlay.style.boxShadow = 'inset 0 0 30px rgba(196, 69, 105, 0.3)';

    setTimeout(() => {
      boardEl.style.backgroundImage = `url(${pendingPhotoURL})`;
      overlay.remove();
      onComplete();
    }, 600);
  }, totalTime);
}

function spawnHearts() {
  const hearts = ['\u{2764}\u{FE0F}', '\u{1F497}', '\u{1F496}', '\u{1F495}', '\u{1F49E}', '\u{2728}'];
  for (let i = 0; i < 18; i++) {
    const span = document.createElement('span');
    span.className = 'falling-heart';
    span.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    span.style.left = `${5 + Math.random() * 90}%`;
    span.style.setProperty('--heart-size', `${0.7 + Math.random() * 0.7}rem`);
    span.style.setProperty('--heart-dur', `${1.4 + Math.random() * 1}s`);
    span.style.setProperty('--heart-delay', `${Math.random() * 1.2}s`);
    document.body.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  }
}

// ============ Voice Note ============

let voiceAudio = null;

function showVoiceNoteButton() {
  // Remove any existing button
  const existing = document.querySelector('.voice-note-btn');
  if (existing) existing.remove();

  if (!pendingPhotoURL) return;

  // Derive voice note path from photo path: photos/photo-07.jpg → voice/photo-07.m4a
  const photoFile = pendingPhotoURL.split('/').pop(); // "photo-07.jpg"
  const voiceFile = photoFile.replace(/\.\w+$/, '.m4a'); // "photo-07.m4a"
  const voicePath = 'voice/' + voiceFile;

  // Check if voice note exists (HEAD request)
  fetch(voicePath, { method: 'HEAD' }).then(resp => {
    if (!resp.ok) return; // No voice note for this photo — skip

    const btn = document.createElement('button');
    btn.className = 'voice-note-btn';
    btn.innerHTML = '🎧';
    btn.title = 'Play voice note';
    btn.addEventListener('click', () => toggleVoiceNote(voicePath, btn));

    boardEl.appendChild(btn);

    // Gentle entrance animation
    requestAnimationFrame(() => btn.classList.add('visible'));
  }).catch(() => {});
}

function toggleVoiceNote(src, btn) {
  if (voiceAudio && !voiceAudio.paused) {
    voiceAudio.pause();
    voiceAudio.currentTime = 0;
    btn.classList.remove('playing');
    return;
  }

  voiceAudio = new Audio(src);
  btn.classList.add('playing');
  voiceAudio.play();
  voiceAudio.onended = () => btn.classList.remove('playing');
}

// ============ Event Listeners ============

btnNewGame.addEventListener('click', startNewGame);

// ============ Init ============

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

startNewGame();
