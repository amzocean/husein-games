// app.js — Main application controller for Fatema Tiles

import { GameState } from './engine.js';
import { renderBoard, updateTileSVG } from './renderer.js';
import { getDailyPhotoURL } from './photos.js';

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

  winBanner.textContent = `\u{1F495} Revealed in ${game.moveCount} moves!`;
  winBanner.classList.add('visible');
  spawnHearts();
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

// ============ Event Listeners ============

btnNewGame.addEventListener('click', startNewGame);

// ============ Init ============

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

startNewGame();
