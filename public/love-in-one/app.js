import { VALID_WORDS } from './words.js';
import { PUZZLES } from './puzzles.js';

const WORD_SET = new Set(VALID_WORDS.map(word => word.toUpperCase()));
for (const puzzle of PUZZLES) {
  WORD_SET.add(puzzle.answer);
  WORD_SET.add(puzzle.clue);
}

const keyboardRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

const board = document.getElementById('board');
const boardScroll = document.getElementById('boardScroll');
const keyboard = document.getElementById('keyboard');
const roundTabs = document.getElementById('roundTabs');
const roundLabel = document.getElementById('roundLabel');
const attemptCount = document.getElementById('attemptCount');
const status = document.getElementById('status');
const answerCard = document.getElementById('answerCard');
const answerWord = document.getElementById('answerWord');
const answerDefinition = document.getElementById('answerDefinition');
const answerSentence = document.getElementById('answerSentence');
const nextButton = document.getElementById('nextButton');
const todayLabel = document.getElementById('todayLabel');
const helpDialog = document.getElementById('helpDialog');
const celebration = document.getElementById('celebration');

const dateKey = new Date().toISOString().slice(0, 10);
const dailyPuzzles = selectDailyPuzzles(dateKey);
const storageKey = `love-in-one:v2:${dateKey}`;
let state = loadState();
let currentInput = '';
let freshInputIndex = -1;
let revealGuessIndex = -1;

todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${dateKey}T12:00:00Z`));

buildKeyboard();
render();

document.getElementById('helpButton').addEventListener('click', () => helpDialog.showModal());
document.getElementById('closeHelpButton').addEventListener('click', () => helpDialog.close());
document.getElementById('startButton').addEventListener('click', () => helpDialog.close());
helpDialog.addEventListener('click', event => {
  if (event.target === helpDialog) helpDialog.close();
});

nextButton.addEventListener('click', () => {
  const nextUnsolved = state.rounds.findIndex((round, index) => index > state.current && !round.solved);
  const anyUnsolved = state.rounds.findIndex(round => !round.solved);
  state.current = nextUnsolved >= 0 ? nextUnsolved : anyUnsolved >= 0 ? anyUnsolved : (state.current + 1) % 3;
  currentInput = '';
  saveState();
  render();
});

document.addEventListener('keydown', event => {
  if (helpDialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.closest('button, a, input, textarea, select')) return;
  if (event.key === 'Enter') handleKey('ENTER');
  else if (event.key === 'Backspace' || event.key === 'Delete') handleKey('BACK');
  else if (/^[a-zA-Z]$/.test(event.key)) handleKey(event.key.toUpperCase());
});

function selectDailyPuzzles(key) {
  const scheduleStart = Date.parse('2026-09-17T00:00:00Z');
  const requestedDay = Date.parse(`${key}T00:00:00Z`);
  const elapsedDays = Math.floor((requestedDay - scheduleStart) / 86400000);
  const scheduleDays = PUZZLES.length / 3;
  const dayIndex = ((elapsedDays % scheduleDays) + scheduleDays) % scheduleDays;
  return PUZZLES.slice(dayIndex * 3, dayIndex * 3 + 3);
}

function loadState() {
  const empty = { current: 0, rounds: Array.from({ length: 3 }, () => ({ guesses: [], solved: false })) };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || !Array.isArray(saved.rounds) || saved.rounds.length !== 3) return empty;
    return {
      current: Math.max(0, Math.min(2, Number(saved.current) || 0)),
      rounds: saved.rounds.map(round => ({
        guesses: Array.isArray(round.guesses) ? round.guesses.filter(guess => /^[A-Z]{5}$/.test(guess)) : [],
        solved: Boolean(round.solved),
      })),
    };
  } catch {
    return empty;
  }
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn('Daily progress could not be saved.', error);
  }
}

function scoreGuess(guess, answer) {
  const result = Array(5).fill('absent');
  const remaining = {};

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) result[i] = 'exact';
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === 'exact') continue;
    if (remaining[guess[i]] > 0) {
      result[i] = 'present';
      remaining[guess[i]]--;
    }
  }

  return result;
}

function render() {
  const puzzle = dailyPuzzles[state.current];
  const round = state.rounds[state.current];
  roundLabel.textContent = `Word ${state.current + 1} of 3`;
  attemptCount.textContent = `${round.guesses.length} ${round.guesses.length === 1 ? 'guess' : 'guesses'}`;
  status.textContent = round.solved ? 'Beautifully solved.' : 'The first row is your head start.';

  renderTabs();
  renderBoard(puzzle, round);
  renderKeyboard(puzzle, round);
  renderAnswer(puzzle, round);
}

function renderTabs() {
  roundTabs.innerHTML = '';
  state.rounds.forEach((round, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `round-tab${index === state.current ? ' active' : ''}${round.solved ? ' solved' : ''}`;
    button.textContent = String(index + 1);
    button.setAttribute('aria-label', `Word ${index + 1}${round.solved ? ', solved' : ''}`);
    button.setAttribute('aria-current', index === state.current ? 'true' : 'false');
    button.addEventListener('click', () => {
      state.current = index;
      currentInput = '';
      saveState();
      render();
    });
    roundTabs.appendChild(button);
  });
}

function renderBoard(puzzle, round) {
  board.innerHTML = '';
  board.appendChild(createScoredRow(puzzle.clue, puzzle.answer, 'clue-row'));
  round.guesses.forEach((guess, index) => {
    board.appendChild(createScoredRow(guess, puzzle.answer, index === revealGuessIndex ? 'reveal' : ''));
  });

  if (!round.solved) {
    const inputRow = document.createElement('div');
    inputRow.className = 'word-row input-row';
    for (let i = 0; i < 5; i++) {
      const tile = document.createElement('span');
      tile.className = `tile${currentInput[i] ? ' filled' : ''}${i === freshInputIndex ? ' fresh' : ''}`;
      tile.textContent = currentInput[i] || '';
      inputRow.appendChild(tile);
    }
    board.appendChild(inputRow);
  }

  requestAnimationFrame(() => {
    boardScroll.scrollTop = boardScroll.scrollHeight;
  });
  freshInputIndex = -1;
  revealGuessIndex = -1;
}

function createScoredRow(word, answer, extraClass = '') {
  const row = document.createElement('div');
  row.className = `word-row ${extraClass}`.trim();
  const scores = scoreGuess(word, answer);
  word.split('').forEach((letter, index) => {
    const tile = document.createElement('span');
    tile.className = `tile ${scores[index]}`;
    tile.textContent = letter;
    tile.setAttribute('aria-label', `${letter}, ${scoreLabel(scores[index])}`);
    row.appendChild(tile);
  });
  return row;
}

function scoreLabel(score) {
  if (score === 'exact') return 'right letter in the right place';
  if (score === 'present') return 'right letter in the wrong place';
  return 'not in the answer';
}

function buildKeyboard() {
  keyboardRows.forEach(rowLetters => {
    const row = document.createElement('div');
    row.className = 'key-row';
    rowLetters.forEach(letter => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `key${letter.length > 1 ? ' wide' : ''}`;
      button.dataset.key = letter;
      button.textContent = letter === 'BACK' ? '⌫' : letter;
      button.setAttribute('aria-label', letter === 'BACK' ? 'Backspace' : letter);
      button.addEventListener('click', () => handleKey(letter));
      row.appendChild(button);
    });
    keyboard.appendChild(row);
  });
}

function renderKeyboard(puzzle, round) {
  const priorities = { absent: 1, present: 2, exact: 3 };
  const letterScores = {};
  const scoredWords = [puzzle.clue, ...round.guesses];

  scoredWords.forEach(word => {
    scoreGuess(word, puzzle.answer).forEach((score, index) => {
      const letter = word[index];
      if (!letterScores[letter] || priorities[score] > priorities[letterScores[letter]]) {
        letterScores[letter] = score;
      }
    });
  });

  keyboard.classList.toggle('disabled', round.solved);
  keyboard.querySelectorAll('.key').forEach(key => {
    key.disabled = round.solved;
    key.classList.remove('exact', 'present', 'absent');
    const letter = key.dataset.key;
    key.setAttribute('aria-label', letter === 'BACK' ? 'Backspace' : letter);
    if (letterScores[letter]) {
      key.classList.add(letterScores[letter]);
      key.setAttribute('aria-label', `${letter}, ${scoreLabel(letterScores[letter])}`);
    }
  });
}

function renderAnswer(puzzle, round) {
  answerCard.hidden = !round.solved;
  if (!round.solved) return;

  answerWord.textContent = puzzle.answer;
  answerDefinition.textContent = puzzle.definition;
  answerSentence.textContent = `“${puzzle.sentence}”`;

  const solvedCount = state.rounds.filter(item => item.solved).length;
  nextButton.textContent = solvedCount === 3 ? 'See today’s words again' : 'Next word';
}

function handleKey(key) {
  const puzzle = dailyPuzzles[state.current];
  const round = state.rounds[state.current];
  if (round.solved) return;

  if (key === 'BACK') {
    currentInput = currentInput.slice(0, -1);
    freshInputIndex = -1;
    renderBoard(puzzle, round);
    return;
  }

  if (key === 'ENTER') {
    submitGuess(puzzle, round);
    return;
  }

  if (/^[A-Z]$/.test(key) && currentInput.length < 5) {
    currentInput += key;
    freshInputIndex = currentInput.length - 1;
    renderBoard(puzzle, round);
  }
}

function submitGuess(puzzle, round) {
  if (currentInput.length !== 5) {
    status.textContent = 'Enter five letters first.';
    shakeInput();
    return;
  }

  if (!WORD_SET.has(currentInput)) {
    status.textContent = 'That word is not in our dictionary.';
    shakeInput();
    return;
  }

  const guess = currentInput;
  round.guesses.push(guess);
  revealGuessIndex = round.guesses.length - 1;
  currentInput = '';

  if (guess === puzzle.answer) {
    round.solved = true;
    status.textContent = 'You found it!';
    celebrate();
  } else {
    status.textContent = 'Not quite—use the new clues and try again.';
  }

  saveState();
  render();
}

function shakeInput() {
  const row = board.querySelector('.input-row');
  if (!row) return;
  row.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }],
    { duration: 220 }
  );
}

function celebrate() {
  const colors = ['#6aaa64', '#c9b458', '#787c7e', '#c94f6d', '#f2a3b5'];
  celebration.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('i');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--drift', `${Math.round(Math.random() * 160 - 80)}px`);
    piece.style.animationDelay = `${Math.random() * 350}ms`;
    celebration.appendChild(piece);
  }
  setTimeout(() => { celebration.innerHTML = ''; }, 2300);
}
