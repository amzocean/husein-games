const STORAGE_KEY = 'wisdom-cipher-state-v1';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_HINTS = Infinity;
const KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['BACKSPACE', 'Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const state = {
  quotes: [],
  quote: null,
  puzzle: null,
  quoteIndex: 0,
  dateKey: '',
  storage: loadStorage(),
  progress: null,
  selectedCipher: null,
  selectedPos: -1,
  wrongCipher: null,
  revealVisible: false,
  toastId: null,
  elements: {}
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheElements();
  bindEvents();

  try {
    const response = await fetch('./quotes.json');
    if (!response.ok) throw new Error(`Unable to load quotes (${response.status})`);
    state.quotes = await response.json();
    buildDailyPuzzle();
    hydrateProgress();
    render();
  } catch (error) {
    console.error(error);
    state.elements.quoteGrid.classList.remove('loading');
    state.elements.quoteGrid.textContent = 'Unable to load today\'s wisdom. Please refresh.';
    state.elements.keyboardWrap.hidden = true;
  }
}

function cacheElements() {
  state.elements = {
    gameCard: document.getElementById('gameCard'),
    quoteGrid: document.getElementById('quoteGrid'),
    quotePanel: document.getElementById('quotePanel'),
    solveReveal: document.getElementById('solveReveal'),
    pageImage: document.getElementById('pageImage'),
    revealMistakes: document.getElementById('revealMistakes'),
    revealHints: document.getElementById('revealHints'),
    selectionHint: document.getElementById('selectionHint'),
    keyboard: document.getElementById('keyboard'),
    keyboardWrap: document.getElementById('keyboardWrap'),
    nextPuzzle: document.getElementById('nextPuzzle'),
    statsBar: document.getElementById('statsBar'),
    progressStat: document.getElementById('progressStat'),
    mistakesStat: document.getElementById('mistakesStat'),
    hintBtn: document.getElementById('hintBtn'),
    hintsStat: document.getElementById('hintsStat'),
    toast: document.getElementById('toast')
  };
}

function bindEvents() {
  state.elements.quoteGrid.addEventListener('click', (event) => {
    const cell = event.target.closest('.cipher-cell');
    if (!cell || state.progress?.solved) return;
    selectCipher(cell.dataset.cipher, parseInt(cell.dataset.pos, 10));
  });

  state.elements.keyboard.addEventListener('click', (event) => {
    const button = event.target.closest('.key-button');
    if (!button || state.progress?.solved) return;
    const key = button.dataset.key;
    if (key === 'BACKSPACE') { removeAssignment(); return; }
    assignPlainLetter(key);
  });

  document.addEventListener('keydown', (event) => {
    if (!state.progress || state.progress.solved) return;
    if (/^[a-z]$/i.test(event.key)) { assignPlainLetter(event.key.toUpperCase()); return; }
    if (event.key === 'Backspace' || event.key === 'Delete') removeAssignment();
  });

  state.elements.hintBtn.addEventListener('click', () => {
    if (state.progress?.solved) return;
    useHint();
  });

  state.elements.nextPuzzle.addEventListener('click', () => {
    startNewPuzzle();
  });
}

function startNewPuzzle() {
  buildDailyPuzzle();
  hydrateProgress();
  render();
}

const MAX_WORDS = 10;

function hookQuote(text) {
  const words = text.split(' ');
  if (words.length <= MAX_WORDS) return { hook: text, isPartial: false };
  return { hook: words.slice(0, MAX_WORDS).join(' ') + '...', isPartial: true };
}

function buildDailyPuzzle() {
  const seed = Date.now();
  state.dateKey = 'game-' + seed;
  const random = mulberry32(seed);
  const picked = state.quotes[Math.floor(random() * state.quotes.length)];
  state.quoteIndex = state.quotes.indexOf(picked);
  state.quote = picked;
  const { hook, isPartial } = hookQuote(picked.cipher);
  state.isPartial = isPartial;

  const plainToCipher = generateDerangement(random);
  const cipherToPlain = invertMapping(plainToCipher);
  const words = hook.split(' ').map((word) =>
    [...word].map((char) => buildToken(char, plainToCipher))
  );

  const uniqueCipherLetters = [];
  words.forEach((word) => word.forEach((token) => {
    if (token.type === 'letter' && !uniqueCipherLetters.includes(token.cipherLetter))
      uniqueCipherLetters.push(token.cipherLetter);
  }));

  state.puzzle = { words, plainToCipher, cipherToPlain, uniqueCipherLetters };
}

function hydrateProgress() {
  state.progress = { quoteIndex: state.quoteIndex, assignments: {}, solved: false, mistakes: 0, hintsUsed: 0 };
  state.revealVisible = false;
  state.selectedCipher = getFirstUnresolvedCipher();
}

function normalizeProgress(saved) {
  const assignments = {};
  Object.entries(saved.assignments || {}).forEach(([cipher, plain]) => {
    const c = String(cipher || '').toUpperCase();
    const p = String(plain || '').toUpperCase();
    if (ALPHABET.includes(c) && ALPHABET.includes(p)) assignments[c] = p;
  });
  return { quoteIndex: state.quoteIndex, assignments, solved: Boolean(saved.solved) };
}

function persistProgress() {
  if (!state.progress) return;
  state.storage.progress[state.dateKey] = { ...state.progress };
  saveStorage(state.storage);
}

function render() {
  if (!state.quote || !state.progress) return;

  const solved = state.progress.solved;
  const revealing = state.revealVisible;

  // hide all gameplay when revealing
  state.elements.quotePanel.hidden = revealing;
  state.elements.keyboardWrap.hidden = solved || revealing;
  state.elements.selectionHint.hidden = solved || revealing;
  state.elements.statsBar.hidden = solved || revealing;
  state.elements.solveReveal.hidden = !revealing;
  state.elements.solveReveal.classList.toggle('is-visible', revealing);
  state.elements.gameCard.classList.toggle('is-complete', solved);

  if (!revealing) {
    renderQuoteGrid();
    renderKeyboard();
    renderSelectionHint();
    renderStats();
  }
  renderReveal();
}

function renderQuoteGrid() {
  const fragment = document.createDocumentFragment();

  let flatPos = 0;
  state.puzzle.words.forEach((word) => {
    const wordEl = document.createElement('div');
    wordEl.className = 'word-group';

    word.forEach((token) => {
      if (token.type === 'letter') {
        const guessed = state.progress.assignments[token.cipherLetter] || '';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cipher-cell';
        btn.dataset.cipher = token.cipherLetter;
        btn.dataset.pos = flatPos++;

        if (!guessed) btn.classList.add('is-empty');
        if (state.selectedCipher === token.cipherLetter) btn.classList.add('is-selected');
        if (state.selectedPos === (flatPos - 1)) btn.classList.add('is-cursor');
        if (guessed && guessed === token.expectedPlain) btn.classList.add('is-correct');
        if (guessed && guessed !== token.expectedPlain) btn.classList.add('is-wrong');
        if (state.wrongCipher === token.cipherLetter) btn.classList.add('is-wrong');

        const top = document.createElement('span');
        top.className = 'cipher-top';
        top.textContent = token.displayCipher;

        const bottom = document.createElement('span');
        bottom.className = 'guess-bottom';
        bottom.textContent = guessed ? guessed.toUpperCase() : '';

        btn.append(top, bottom);
        wordEl.appendChild(btn);
      } else {
        const punct = document.createElement('span');
        punct.className = 'cipher-punct';
        punct.textContent = token.char;
        wordEl.appendChild(punct);
      }
    });

    fragment.appendChild(wordEl);
  });

  state.elements.quoteGrid.classList.remove('loading');
  state.elements.quoteGrid.replaceChildren(fragment);
}

function renderKeyboard() {
  const fragment = document.createDocumentFragment();

  KEYBOARD_LAYOUT.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'keyboard-row';

    row.forEach((key) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'key-button';
      btn.dataset.key = key;

      if (key === 'BACKSPACE') {
        btn.classList.add('backspace');
        btn.innerHTML = '<span class="key-main">⌫</span>';
        rowEl.appendChild(btn);
        return;
      }

      const assignedCipher = findAssignedCipher(key);
      const active = state.selectedCipher && state.progress.assignments[state.selectedCipher] === key;
      const isCorrect = assignedCipher && state.puzzle.cipherToPlain[assignedCipher] === key;
      if (active) btn.classList.add('is-active');
      if (isCorrect) btn.classList.add('is-correct');
      if (assignedCipher) btn.classList.add('is-used');
      if (assignedCipher && assignedCipher !== state.selectedCipher) btn.classList.add('is-occupied');

      const main = document.createElement('span');
      main.className = 'key-main';
      main.textContent = key;
      btn.appendChild(main);

      if (assignedCipher) {
        const sub = document.createElement('span');
        sub.className = 'key-sub';
        sub.textContent = assignedCipher;
        btn.appendChild(sub);
      }

      rowEl.appendChild(btn);
    });

    fragment.appendChild(rowEl);
  });

  state.elements.keyboard.replaceChildren(fragment);
}

function renderSelectionHint() {
  if (state.progress.solved) return;
  if (!state.selectedCipher) {
    state.elements.selectionHint.textContent = 'Tap a cipher letter, then pick its real letter below.';
    return;
  }
  const assigned = state.progress.assignments[state.selectedCipher];
  state.elements.selectionHint.textContent = assigned
    ? `${state.selectedCipher} → ${assigned}. Pick a new letter or tap ⌫.`
    : `${state.selectedCipher} is selected. Pick its real letter.`;
}

function renderStats() {
  if (state.progress.solved) return;
  const total = state.puzzle.uniqueCipherLetters.length;
  const correct = state.puzzle.uniqueCipherLetters.filter(
    (c) => state.progress.assignments[c] === state.puzzle.cipherToPlain[c]
  ).length;
  state.elements.progressStat.textContent = `${correct} / ${total}`;
  state.elements.mistakesStat.textContent = `${state.progress.mistakes} ✗`;
  state.elements.hintsStat.textContent = `${state.progress.hintsUsed} 💡`;
}

function useHint() {
  if (!state.progress || state.progress.solved) return;

  // find an unresolved cipher letter (prefer selected, else first unresolved)
  let target = state.selectedCipher;
  if (!target || state.progress.assignments[target] === state.puzzle.cipherToPlain[target]) {
    target = getFirstUnresolvedCipher();
  }
  if (!target) return;

  const correctPlain = state.puzzle.cipherToPlain[target];
  // clear any other cipher using this plain letter
  Object.keys(state.progress.assignments).forEach((key) => {
    if (key !== target && state.progress.assignments[key] === correctPlain)
      delete state.progress.assignments[key];
  });

  state.progress.assignments[target] = correctPlain;
  state.progress.hintsUsed++;
  vibrate(10);
  persistProgress();

  if (isPuzzleSolved()) { completePuzzle(); return; }
  state.selectedCipher = getFirstUnresolvedCipher();
  render();
}

function renderReveal(){
  if (!state.revealVisible) return;
  const imageIndex = state.quote.page - 1;
  state.elements.pageImage.src = `./pages/Raudat Hidayaat 1-images-${imageIndex}.jpg`;
  state.elements.pageImage.alt = `Raudat Hidayaat page ${state.quote.page}`;
  state.elements.revealMistakes.textContent = state.progress.mistakes;
  state.elements.revealHints.textContent = state.progress.hintsUsed;
}

function selectCipher(cipherLetter, pos = -1) {
  if (!cipherLetter) return;
  vibrate(10);
  state.selectedCipher = cipherLetter;
  state.selectedPos = pos;
  render();
}

function assignPlainLetter(plainLetter) {
  if (!state.progress || state.progress.solved) return;
  if (!state.selectedCipher) state.selectedCipher = getFirstUnresolvedCipher();
  const cipherLetter = state.selectedCipher;
  if (!cipherLetter) return;

  // clear any other cipher that had this plain letter
  Object.keys(state.progress.assignments).forEach((key) => {
    if (key !== cipherLetter && state.progress.assignments[key] === plainLetter)
      delete state.progress.assignments[key];
  });

  state.progress.assignments[cipherLetter] = plainLetter;
  vibrate(10);

  if (plainLetter !== state.puzzle.cipherToPlain[cipherLetter]) {
    state.progress.mistakes++;
    triggerWrongFeedback(cipherLetter);
    // Don't persist the wrong assignment or move selection — it auto-clears
    return;
  }

  persistProgress();

  if (isPuzzleSolved()) { completePuzzle(); return; }
  state.selectedCipher = getFirstUnresolvedCipher();
  render();
}

function removeAssignment() {
  if (!state.progress || state.progress.solved) return;
  if (!state.selectedCipher) { state.selectedCipher = getFirstUnresolvedCipher(); render(); return; }
  if (!state.progress.assignments[state.selectedCipher]) { showToast('Nothing to clear.'); return; }
  delete state.progress.assignments[state.selectedCipher];
  vibrate(10);
  persistProgress();
  render();
}

async function completePuzzle() {
  if (state.progress.solved) return;
  state.progress.solved = true;
  state.selectedCipher = null;
  state.selectedPos = -1;
  persistProgress();
  render();
  vibrate([15, 40, 20]);
  await wait(300);
  state.revealVisible = true;
  render();
  showToast('Wisdom revealed ✨');
}

function isPuzzleSolved() {
  return state.puzzle.uniqueCipherLetters.every((c) => state.progress.assignments[c] === state.puzzle.cipherToPlain[c]);
}

function getFirstUnresolvedCipher() {
  // Build flat list of letter tokens in reading order
  const letterTokens = state.puzzle.words.flatMap((w) => w).filter((t) => t.type === 'letter');
  if (!letterTokens.length) return null;
  const unresolved = (c) => state.progress.assignments[c] !== state.puzzle.cipherToPlain[c];

  // Start scanning from the user's cursor position (selectedPos),
  // so the next selection is visually near where they were working.
  const startIdx = state.selectedPos >= 0 && state.selectedPos < letterTokens.length
    ? state.selectedPos : -1;

  for (let i = 1; i <= letterTokens.length; i++) {
    const idx = (startIdx + i) % letterTokens.length;
    const t = letterTokens[idx];
    if (unresolved(t.cipherLetter)) {
      state.selectedPos = idx;
      return t.cipherLetter;
    }
  }
  return null;
}

function triggerWrongFeedback(cipherLetter) {
  state.wrongCipher = cipherLetter;
  render();
  setTimeout(() => {
    if (state.wrongCipher === cipherLetter) {
      state.wrongCipher = null;
      delete state.progress.assignments[cipherLetter];
      // Keep selection on the same cipher letter
      state.selectedCipher = cipherLetter;
      persistProgress();
      render();
    }
  }, 1000);
}

function showToast(message) {
  clearTimeout(state.toastId);
  state.elements.toast.textContent = message;
  state.elements.toast.classList.add('is-visible');
  state.toastId = setTimeout(() => state.elements.toast.classList.remove('is-visible'), 1800);
}

function findAssignedCipher(plainLetter) {
  return Object.keys(state.progress.assignments).find((c) => state.progress.assignments[c] === plainLetter) || '';
}

function buildToken(char, plainToCipher) {
  if (!/[A-Za-z]/.test(char)) return { type: 'punct', char };
  const upper = char.toUpperCase();
  return {
    type: 'letter', cipherLetter: plainToCipher[upper], expectedPlain: upper,
    displayCipher: char === upper ? plainToCipher[upper] : plainToCipher[upper].toLowerCase(),
    isUpper: char === upper
  };
}

function generateDerangement(random) {
  const letters = [...ALPHABET];
  let shuffled;
  do {
    shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } while (shuffled.some((l, i) => l === letters[i]));
  return Object.fromEntries(letters.map((l, i) => [l, shuffled[i]]));
}

function invertMapping(m) { return Object.fromEntries(Object.entries(m).map(([a, b]) => [b, a])); }

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function dateSeed(s) { let h = 0; for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0; return h; }

function getDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadStorage() {
  try { return { progress: (JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')).progress || {} }; }
  catch { return { progress: {} }; }
}

function saveStorage(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function vibrate(pattern) { try { navigator.vibrate?.(pattern); } catch {} }
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
