# Hidaayat Ciphers — Developer Documentation

> **Parent doc**: [../../DOCUMENTATION.md](../../DOCUMENTATION.md) (project-wide architecture, deployment, common tasks)

---

## Overview

A substitution cipher puzzle game built around wisdom quotes from **Raudat Hidayaat 1 & 2** (رَوْضَة الْهِدَايَة) — a collection of sayings of Syedna Mohammed Burhanuddin (RA). Players decode encrypted quotes letter-by-letter, then see the original Arabic manuscript page upon solving. Purely static, single-player, no server logic.

**Core loop:** See cipher → tap cell → pick real letter → green = correct, shake + auto-clear = wrong → solve all → book page reveal.

**Landing page tile:** 📜 emoji, "Hidaayat Ciphers" title, "Decode substitution-encrypted wisdom quotes from Raudat Hidayaat" subtitle, SOLO badge. Defined in `public/index.html`.

---

## Files

```
public/hidaayat-ciphers/
├── index.html              # Game shell (~200 lines) — inline critical CSS + tutorial modal HTML
├── cipher.js               # Game engine (~522 lines) — all logic, state, rendering, events
├── style.css               # Styling (~973 lines) — navy/gold/cream theme, dark mode, responsive,
│                           #   tutorial modal, info button, cursor blink animation
├── quotes.json             # 142 quotes (78 Book 1 + 64 Book 2) with page numbers and book field
├── pages/                  # 731 book page JPGs (committed to repo)
│   ├── Raudat Hidayaat 1-images-{0-242}.jpg   (243 pages)
│   ├── Raudat Hidayaat 2-images-{0-316}.jpg   (317 pages)
│   └── Raudat Hidayaat 3-images-{0-170}.jpg   (171 pages, quotes disabled — pending corrected MD)
└── DOCUMENTATION.md        # This file

public/quote-search/
└── index.html              # Hidaayaat Lookup — keyword search across all active quotes
```

**Hidaayaat Lookup** (`/quote-search/`) shares the same `quotes.json` and page images.
It provides keyword-based topic search with clickable results that expand to show page images.
```

**No build step.** Everything is vanilla JS/CSS served statically by the Express server.

---

## Gameplay Mechanics

### Starting a Puzzle
1. On page load, `init()` fetches `quotes.json`, picks a random quote (seeded by `Date.now()`), generates a derangement cipher
2. Each reload gives a new random puzzle — no daily rotation, no streak tracking
3. The first unresolved cipher letter is auto-selected with cursor on the first instance

### Solving Flow
1. **Tap a cipher cell** (top label = cipher letter, bottom = your guess) to select it
2. **Tap a keyboard letter** to assign it as the decoded letter
3. **Correct guess**: cell turns green, selection auto-advances to next unresolved cipher **from the cursor position** (reading order, wrapping around)
4. **Wrong guess**: cell turns pink + shakes for 1 second, then **auto-clears** the wrong assignment and keeps selection on the same cipher — player retries without manually clearing
5. **Hint button**: reveals the correct letter for the selected (or first unresolved) cipher cell
6. **Backspace (⌫)**: clears the assignment on the currently selected cell
7. **Physical keyboard**: typing A-Z assigns letters, Backspace/Delete clears

### Selection Model — Cipher vs Cursor

This is a two-level selection system:

| Concept | State variable | What it does | Visual indicator |
|---------|---------------|-------------|------------------|
| **Selected cipher** | `state.selectedCipher` | Which cipher LETTER is active (e.g., "Z") | Gold border on ALL instances (`.is-selected`) |
| **Cursor position** | `state.selectedPos` | Which specific CELL the user tapped (flat token index) | Blinking gold underscore on THAT cell only (`.is-cursor`) |

**Why two levels?** When you tap a cell, you want to see all instances of that cipher letter highlighted (helps pattern recognition). But when the game auto-advances after solving, it needs to know WHERE you were — advancing from the last instance of "Z" vs the first instance makes a big difference on long quotes.

**How it works:**
- `flatPos` counter in `renderQuoteGrid()` assigns sequential indices to every letter token (skipping punctuation), stamped as `data-pos` attribute
- On cell tap: `selectCipher(cipherLetter, pos)` stores both values
- `getFirstUnresolvedCipher()` scans from `state.selectedPos` forward (wrapping) through the flat token list, and ALSO updates `state.selectedPos` to the found index — so the cursor moves visually
- `is-cursor` class uses a `::after` pseudo-element with `cursor-blink` animation (1s ease-in-out infinite)

### Letter Exclusivity
Each plain letter can only be assigned to one cipher letter at a time. If you assign "T" to cipher "X", and "T" was already assigned to cipher "Q", the assignment is silently moved — cipher "Q" is cleared.

### Hook + Reveal (Long Quotes)
Quotes longer than 10 words are truncated to the first 10 words with `...` appended. The `...` passes through as punctuation tokens (not cipher letters). After solving, the post-solve reveal shows the complete quote via the book page image.

- `hookQuote(text)` in `cipher.js` (line ~123) handles truncation
- `state.isPartial` flag tracks whether the current quote was truncated
- All 78 quotes remain in the pool — long ones just get hook-truncated

### Scoring
- **Progress**: X / Y unique cipher letters correctly solved (displayed in stats bar)
- **Mistakes**: incremented each time a wrong letter is assigned (even though it auto-clears)
- **Hints used**: incremented each time the Hint button is pressed

### Post-Solve Reveal
On completing the puzzle:
1. All gameplay UI hides (quote panel, keyboard, stats, hint bar)
2. `state.selectedPos` resets to -1, `state.selectedCipher` resets to null
3. A full-screen overlay appears inside the game card (z-index 10), filling the entire card (`inset: 0`)
4. Shows: score line ("Solved with X mistakes · Y hints") + book page image + "Next Puzzle ▸" button
5. The book page image maps: `page N → ./pages/Raudat%20Hidayaat%201-images-{N-1}.jpg` (URL-encoded spaces, 0-indexed)
6. Image is preloaded at puzzle creation time (in `buildDailyPuzzle()`) so it's cached by solve time
7. Image `onerror` handler retries once with a cache-busting query param
8. The `?` info button is hidden during the reveal to prevent z-index overlap

### Tutorial / How to Play
A `?` button (`.info-btn`) sits in the top-right corner of the game card. Tapping it opens a full-screen tutorial overlay (`#tutorialOverlay`) with:

1. **Goal line**: "A quote from Raudat Hidayaat has been encrypted by substituting each letter with another random letter. Your challenge is to decrypt it back using your linguistic intuition."
2. **5 visual steps** with animated demo cells:
   - Step 1: Tap a cipher cell to select it (demo cell with gold border)
   - Step 2: Type real letter on keyboard (demo cell + keyboard key)
   - Step 3: Correct → all instances turn green (two green demo cells)
   - Step 4: Wrong → shakes red, clears (shaking red demo cell, CSS `demo-shake` infinite animation)
   - Step 5: Stuck → use Hint button
3. **"Got it!" button** to dismiss

**Close triggers:** ✕ button, "Got it!" button, or tapping the dark backdrop. All call `closeTutorial()` which sets `hidden` attribute on the overlay.

The tutorial HTML lives in `index.html` (lines 128-197), CSS in `style.css` (lines 596-793), JS binding in `bindEvents()` (lines 103-112).

---

## Architecture — `cipher.js` Deep Dive

### Constants & State

```javascript
const STORAGE_KEY = 'wisdom-cipher-state-v1';   // localStorage key
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_HINTS = Infinity;                       // No limit
const MAX_WORDS = 10;                             // Hook truncation threshold
const KEYBOARD_LAYOUT = [['Q','W',...], ['A','S',...], ['BACKSPACE','Z',...]];
```

```javascript
state = {
  quotes: [],           // All 142 quotes loaded from JSON (78 Book 1 + 64 Book 2)
  quote: null,          // Current quote object { cipher, full, source, page }
  puzzle: null,         // { words, plainToCipher, cipherToPlain, uniqueCipherLetters }
  quoteIndex: 0,        // Index into quotes array
  dateKey: '',          // Unique key for localStorage ('game-' + timestamp)
  isPartial: false,     // True if quote was hook-truncated
  storage: {},          // Persisted progress data from localStorage
  progress: {
    assignments: {},    // { cipherLetter: guessedPlainLetter }
    solved: false,
    mistakes: 0,
    hintsUsed: 0
  },
  selectedCipher: null, // Currently selected cipher LETTER (all instances highlight)
  selectedPos: -1,      // Flat token index of the specific CELL the user tapped (cursor)
  wrongCipher: null,    // Cipher letter currently showing wrong feedback (auto-clears)
  revealVisible: false, // Show post-solve overlay
  toastId: null,        // setTimeout ID for toast auto-hide
  elements: {}          // Cached DOM references (18 elements)
}
```

### Function Reference

| Function | Lines | Purpose |
|----------|-------|---------|
| `init()` | 28–44 | Entry point. Fetches quotes.json, builds puzzle, hydrates progress, renders |
| `cacheElements()` | 47–70 | Caches 18 DOM references into `state.elements` (gameplay + tutorial) |
| `bindEvents()` | 73–112 | Event delegation: quote grid clicks, keyboard clicks, physical keydown, hint, next puzzle, tutorial open/close |
| `startNewPuzzle()` | 115–118 | Builds fresh puzzle and resets progress (called by "Next Puzzle" button) |
| `hookQuote(text)` | 123–127 | Truncates quotes > 10 words to first 10 + `...`. Returns `{ hook, isPartial }` |
| `buildDailyPuzzle()` | 129–152 | Picks random quote (seeded by `Date.now()`), generates derangement, tokenizes words |
| `hydrateProgress()` | 154–158 | Initializes fresh progress state, selects first unresolved cipher |
| `normalizeProgress()` | 160–168 | Sanitizes saved progress from localStorage (uppercase validation) |
| `persistProgress()` | 170–174 | Saves current progress to localStorage under `state.dateKey` |
| `render()` | 176–198 | Master render — toggles gameplay vs reveal, dispatches to sub-renderers |
| `renderQuoteGrid()` | 200–247 | Builds cipher cell DOM with `data-pos` attributes and `is-cursor` class |
| `renderKeyboard()` | 249–296 | Builds QWERTY keyboard with state classes (correct/active/used/occupied) |
| `renderSelectionHint()` | 298–308 | Shows contextual hint text below stats bar |
| `renderStats()` | 310–319 | Updates progress counter, mistakes, hints used |
| `useHint()` | 321–346 | Reveals correct letter for selected/first-unresolved cipher. Clears conflicting assignments |
| `renderReveal()` | 348–355 | Sets book page image src and score text |
| `selectCipher(cipher, pos)` | 357–363 | Sets selected cipher AND cursor position on cell tap, vibrates, re-renders |
| `assignPlainLetter()` | 365–392 | Core gameplay. Assigns guess, checks correctness. Correct → advance from cursor. Wrong → shake + auto-clear |
| `removeAssignment()` | 394–402 | Clears assignment on selected cipher (⌫ handler) |
| `completePuzzle()` | 404–416 | Marks solved, resets selectedCipher and selectedPos, triggers reveal overlay after 300ms delay |
| `isPuzzleSolved()` | 418–420 | Checks if all unique cipher letters have correct assignments |
| `getFirstUnresolvedCipher()` | 422–442 | Position-aware: scans flat token list from `selectedPos` forward (wrapping), updates `selectedPos` to found index |
| `triggerWrongFeedback()` | 444–457 | Shows wrong state for 1s, then auto-clears assignment. Preserves `selectedCipher` so cursor stays |
| `showToast()` | 459–464 | Shows/auto-hides toast message (1.8s) |
| `findAssignedCipher()` | 466–468 | Reverse lookup: which cipher letter has this plain letter assigned? |
| `buildToken()` | 470–478 | Converts a character to a cipher token `{ type: 'letter'\|'punct', ... }` |
| `generateDerangement()` | 480–491 | Fisher-Yates shuffle constrained to derangement (no letter maps to itself) |
| `invertMapping()` | 493 | Creates reverse mapping (plain→cipher ↔ cipher→plain) |
| `mulberry32()` | 495–502 | Deterministic 32-bit PRNG for reproducible shuffles |
| `loadStorage()` / `saveStorage()` | 510–517 | localStorage read/write with error handling |
| `vibrate()` / `wait()` / `clamp()` | 519–522 | Utility: haptic feedback, promise delay, number clamping |

### Cipher Generation — Derangement Algorithm

The substitution cipher uses a **derangement** — a permutation where no element maps to itself. This guarantees every letter must be decoded (no freebies).

```
Algorithm:
1. Start with ALPHABET [A, B, C, ..., Z]
2. Fisher-Yates shuffle to get a random permutation
3. Check: does any letter map to itself? (shuffled[i] === original[i])
4. If yes, reshuffle. If no, done.
5. Result: plainToCipher mapping { A→X, B→Q, C→M, ... }
6. Invert to get cipherToPlain { X→A, Q→B, M→C, ... }
```

The PRNG is `mulberry32(Date.now())` — seeded by current timestamp, so each page reload produces a different puzzle.

### Wrong Guess Flow — Detailed

This was a deliberate UX decision. The full flow:

```
1. User taps keyboard letter K for selected cipher C
2. assignPlainLetter('K') called
3. Any other cipher that had 'K' assigned gets cleared (letter exclusivity)
4. state.progress.assignments[C] = 'K' (temporarily stored for visual feedback)
5. Check: is K the correct plain letter for C?
6. If WRONG:
   a. state.progress.mistakes++ (permanent)
   b. triggerWrongFeedback(C) called
   c. render() shows pink cell with 'K' in it + shake animation (320ms CSS)
   d. After 1000ms timeout:
      - Delete state.progress.assignments[C] (clear the wrong guess)
      - Keep state.selectedCipher = C (don't advance)
      - state.selectedPos unchanged (cursor stays on same cell)
      - persistProgress() + render() (cell goes back to empty, same cell selected)
   e. RETURN (don't advance to next cipher)
7. If CORRECT:
   a. persistProgress()
   b. Check isPuzzleSolved() → completePuzzle() if yes
   c. state.selectedCipher = getFirstUnresolvedCipher() (advance from cursor pos)
   d. render()
```

**Why auto-clear wrong guesses?** The player is trying to solve a specific cipher letter. A wrong guess shouldn't leave visual clutter or force manual cleanup. Show the mistake briefly (so they learn), then clear it so they can try again immediately.

### Position-Aware Advance — `getFirstUnresolvedCipher()` Deep Dive

This function answers: "after solving, what should be selected next?"

```javascript
function getFirstUnresolvedCipher() {
  const letterTokens = state.puzzle.words.flatMap(w => w).filter(t => t.type === 'letter');
  const startIdx = state.selectedPos >= 0 && state.selectedPos < letterTokens.length
    ? state.selectedPos : -1;

  for (let i = 1; i <= letterTokens.length; i++) {
    const idx = (startIdx + i) % letterTokens.length;
    const t = letterTokens[idx];
    if (unresolved(t.cipherLetter)) {
      state.selectedPos = idx;  // MOVE the cursor to found position
      return t.cipherLetter;
    }
  }
  return null;
}
```

**Key behaviors:**
- Scans forward from the user's last tapped cell (not from the first/last instance of a cipher letter)
- Wraps around to the beginning if it reaches the end
- Updates `state.selectedPos` as a side effect — so the cursor moves to the found cell
- Called by: `hydrateProgress()` (initial selection), `assignPlainLetter()` (after correct guess), `useHint()` (after hint)
- Returns `null` if all letters are solved (triggers `completePuzzle()`)

---

## CSS Architecture — `style.css`

### Design System

| Variable | Light Mode | Dark Mode | Purpose |
|----------|-----------|-----------|---------|
| `--bg` | `#f5f0e8` (cream) | `#0e1520` (dark blue) | Page background |
| `--card` | `#faf7f1` (warm white) | `#182030` (navy) | Game card background |
| `--panel` | `#f0ebe1` (linen) | `#1e2a3e` (steel blue) | Quote panel background |
| `--navy` | `#1a2744` | same | Primary text, borders |
| `--gold` | `#c9944a` | same | Accent, selection highlights |
| `--gold-bright` | `#daa520` | same | Keyboard labels, bright accents |
| `--success` / `--success-soft` | `#2e7d4f` / `#e0f0e5` | `#2e7d4f` / `#1a3526` | Correct cell |
| `--danger` / `--danger-soft` | `#b45b4d` / `#fde8e4` | `#b45b4d` / `#3e201c` | Wrong cell |

### Layout Architecture

The layout is a **flex column that fills the viewport** with the keyboard pinned to the bottom:

```
.app-shell (height: 100dvh, flex, align-items: stretch)
└── .game-card (height: 100%, flex column, 14px padding, 6px gap, position: relative)
    ├── .info-btn (position: absolute, top: 10px, right: 10px, z-index: 10) ← ? button
    ├── .quote-panel (flex: 1 1 auto, min-height: 0) ← fills available space
    │   └── .quote-grid (flex-wrap: wrap, overflow-y: auto, padding: 2px 12px)
    │       └── .word-group × N (flex-wrap: nowrap, max-width: 100%) ← each word is one group
    │           └── .cipher-cell × N (var(--cell-w)×50px, flex-shrink, data-pos, data-cipher)
    ├── .stats-bar (flex-shrink: 0) ← progress, mistakes, hints, Hint button
    ├── .selection-hint (flex-shrink: 0) ← contextual text
    ├── .keyboard-wrap (flex-shrink: 0) ← QWERTY keyboard pinned at bottom
    │   └── .keyboard (grid, 3 rows)
    │       └── .key-button × 26 + backspace
    └── .solve-reveal (position: absolute, inset: 0, z-index: 10) ← post-solve overlay

#tutorialOverlay (position: fixed, inset: 0, z-index: 100) ← outside .game-card
└── .tutorial-card (max-width: 380px, max-height: 85dvh, overflow-y: auto)
    ├── .tutorial-close (✕ button)
    ├── .tutorial-title ("How to Play")
    ├── .tutorial-goal (one-line explanation)
    ├── .tutorial-steps (5 demo steps with animated cells)
    └── .tutorial-got-it ("Got it!" button)
```

**Critical layout rules:**
- `.word-group` must be `flex-wrap: nowrap` — keeps all letters of a single word together. The parent `.quote-grid` (`flex-wrap: wrap`) handles line breaks between word groups. `max-width: 100%` combined with `flex-shrink: 1` and `min-width: 0` on cells ensures long words compress instead of overflowing.
- Cipher cell width uses CSS variable `--cell-w`, computed dynamically in `renderQuoteGrid()` based on the longest word length and available grid width. This ensures long words (e.g., "inquisitiveness" at 15 letters) shrink only as much as needed while shorter-word puzzles use full-size cells.
- `.quote-panel` gets `flex: 1 1 auto; min-height: 0` so it takes available space but shrinks for keyboard.
- `.keyboard-wrap`, `.stats-bar`, `.selection-hint` all have `flex-shrink: 0` — they never compress.
- `.app-shell` uses `height: 100dvh` (not `min-height`) to prevent scroll and ensure keyboard is always visible.
- `.info-btn` is `position: absolute` inside `.game-card` (which has `position: relative`) — floats over the quote panel.
- Tutorial overlay is OUTSIDE `.game-card` — uses `position: fixed` at z-index 100, above everything.

### Inline CSS vs External CSS

`index.html` has inline `<style>` for critical-path rendering (app-shell, game-card, quote-panel structure + dark mode). `style.css` provides the full theme. This split prevents a flash of unstyled content.

**If you change layout in `style.css`, check `index.html` inline styles too** — both define `.game-card`, `.quote-panel`, and `.app-shell` properties. The inline styles load first; external CSS overrides/extends them.

### Cell States (CSS Classes)

| Class | Applied when | Visual |
|-------|-------------|--------|
| `.is-empty` | No assignment for this cipher | Transparent bottom + underline placeholder |
| `.is-selected` | This cipher letter is currently selected | Gold border + subtle glow on ALL instances |
| `.is-cursor` | This specific cell is the cursor position | Blinking gold underscore bar (`::after` pseudo-element, `cursor-blink` animation) |
| `.is-correct` | Assignment matches the real letter | Green background + green border shadow |
| `.is-wrong` | Wrong assignment (temporary, 1s) | Pink/red background + shake animation |

**Important: `is-selected` and `is-cursor` are independent.** A cell can have both (the tapped cell), only `is-selected` (other instances of the same cipher letter), or neither.

### Keyboard Key States

| Class | Applied when | Visual |
|-------|-------------|--------|
| `.is-active` | This key is assigned to the currently selected cipher | Gold background |
| `.is-correct` | This key's assignment is confirmed correct | Green background |
| `.is-used` | This key is assigned to some cipher | Slightly dimmed (opacity 0.8) |
| `.is-occupied` | This key is assigned but not to the selected cipher | More dimmed (opacity 0.64) |

### Responsive Breakpoints

| Breakpoint | Purpose | Key Changes |
|------------|---------|-------------|
| Default | Mobile-first | var(--cell-w, 34px)×50px cells, 14px card padding |
| `max-height: 760px` | Short screens | 42px cell height, 8px padding, 38px keyboard keys, tighter gaps |
| `max-width: 400px` | Narrow phones | 40px cell height, 8px padding, 6px shell padding, tighter grid gaps |
| `min-width: 720px` | Desktop | Card capped at 860px height, centered in viewport |

### Dark Mode

Full `prefers-color-scheme: dark` support via CSS custom properties. Both inline styles (index.html) and external CSS (style.css) have matching dark mode overrides. Key changes: navy becomes gold borders, cells get semi-transparent white backgrounds, toast inverts to cream-on-dark, tutorial title becomes `--gold-bright`.

### Animations

| Name | Duration | Purpose | Defined at |
|------|----------|---------|------------|
| `shake` | 320ms | Horizontal oscillation for wrong guesses (±3px, ±2px) | Line ~960 |
| `pop` | 420ms | Scale pulse for hint reveals (1.0 → 1.08 → 1.0) | Line ~968 |
| `cursor-blink` | 1s infinite | Blinking gold underscore on cursor cell (opacity 1→0.25→1) | Line ~188 |
| `fadeIn` | 200ms | Tutorial overlay fade-in | Line ~610 |
| `demo-shake` | 400ms infinite | Continuous shake on wrong-demo cell in tutorial | Line ~722 |

---

## Data Format

### quotes.json

```json
[
  {
    "cipher": "The bane of beauty is vanity.",
    "full": "The bane of beauty is vanity.",
    "source": "Rasulullah (SA)",
    "page": 15,
    "book": 1
  }
]
```

| Field | Purpose |
|-------|---------|
| `cipher` | The quote text used for the puzzle (identical to `full` for all quotes currently) |
| `full` | The complete quote text |
| `source` | Attribution (speaker/author) |
| `page` | Book page number — maps to image via `page - 1` (0-indexed filenames) |
| `book` | Which volume: `1` = Raudat Hidayaat 1, `2` = Raudat Hidayaat 2. Defaults to 1 if omitted |

**Stats:** 142 quotes (78 Book 1 + 64 Book 2). Book 1: pages 15–100. Book 2: pages 35–112.

### Image Mapping

Book page N, volume V → `./pages/Raudat%20Hidayaat%20{V}-images-{N-1}.jpg`

Examples:
- Book 1, Page 15 → `Raudat%20Hidayaat%201-images-14.jpg`
- Book 2, Page 35 → `Raudat%20Hidayaat%202-images-34.jpg`

The `pageImagePath(quote)` helper in `cipher.js` builds the path from the quote's `book` and `page` fields.

731 JPGs total (243 Book 1 + 317 Book 2 + 171 Book 3), committed to the repo. Book 3 images are present but **Book 3 quotes are disabled** in `quotes.json` pending a corrected markdown source file. Source images: `Raudat Hidayaat1_pages/`, `RaudatHidaayaat2/`, and `RaudatHidaayaat3/` (gitignored). **Note:** Spaces in filenames must be URL-encoded as `%20` when used in `src` attributes.

---

## localStorage Persistence

Key: `wisdom-cipher-state-v1`

Structure:
```json
{
  "progress": {
    "game-1715234567890": {
      "quoteIndex": 42,
      "assignments": { "X": "T", "Q": "H" },
      "solved": true,
      "mistakes": 3,
      "hintsUsed": 1
    }
  }
}
```

Each puzzle gets a unique key based on `Date.now()` at creation time. Progress is persisted on every correct guess, hint, and after wrong guess auto-clear. The storage accumulates entries over time — no cleanup mechanism exists (localStorage is ~5MB, each entry is tiny).

**Note:** `selectedPos` and `selectedCipher` are NOT persisted — they are runtime-only state. On page reload, a fresh puzzle is generated and `hydrateProgress()` sets the initial selection.

**Clearing game state:**
```javascript
localStorage.removeItem('wisdom-cipher-state-v1');
location.reload();
```

---

## Design Decisions & Rationale

### 1. Random-on-reload, not daily
Each page refresh gives a new puzzle. No date-seeding — the game is for personal reflection, not competitive daily streaks. `Date.now()` as seed means even rapid reloads get different puzzles.

### 2. Hook truncation at 10 words
Long quotes (up to 225 chars) would overflow the cipher grid on mobile. Instead, only the first 10 words are shown as the puzzle with `...` indicating continuation. The full quote is visible on the book page shown after solving. The `...` characters pass through `buildToken()` as punctuation (not cipher letters).

### 3. All caps display
Decoded letters always display in uppercase (`guessed.toUpperCase()`) for visual consistency on the small cipher cells and easier readability.

### 4. Unlimited hints, tracked but not penalized
No hint limit — the game is meditative, not punitive. Hints used are shown in the score for self-assessment only. The hint system prefers the currently selected cipher; if already solved, it picks the first unresolved one.

### 5. Derangement cipher (no fixed points)
The substitution cipher guarantees no letter maps to itself. Without this, some letters would be "free" (already decoded), making the puzzle feel inconsistent.

### 6. Auto-clear wrong guesses
Wrong assignments flash red for 1 second, then auto-clear. This keeps the player focused on the current cipher letter without accumulating visual clutter from wrong guesses. Mistakes still count permanently in the score.

### 7. Letter exclusivity (one plain per cipher)
Each plain letter can only be assigned to one cipher letter. Assigning it to a new cipher silently clears the old one. This matches how real substitution ciphers work (bijective mapping) and prevents contradictory states.

### 8. Post-solve book page reveal
After solving, the player sees the actual Arabic manuscript page containing the quote. This connects the puzzle to its spiritual source — the game isn't just word play, it's a gateway to the original text.

### 9. No title bar / topbar in gameplay
The game card uses the full viewport without a title header during gameplay. Screen real estate is precious on mobile — every pixel goes to the cipher grid and keyboard.

### 10. Two-level selection (cipher + cursor)
Early versions only tracked which cipher LETTER was selected. All instances highlighted identically and the game couldn't know which specific cell the user tapped. After solving, the next selection jumped to a random instance. The cursor system (`selectedPos`) was added to track the exact cell, so advance follows reading order from where the user was working.

### 11. Tutorial with animated demos (not GIF)
The how-to-play guide uses CSS-animated mini demo cells instead of screenshot GIFs. This keeps the tutorial lightweight (no extra assets), responsive, and theme-aware (adapts to dark mode automatically).

---

## HTML Structure — `index.html`

The HTML is split into three main sections:

```html
<body>
  <!-- 1. Game area -->
  <main class="app-shell">
    <section class="game-card" id="gameCard">
      <button id="infoBtn" class="info-btn">?</button>     <!-- Tutorial trigger -->
      <section class="quote-panel" id="quotePanel">...</section>
      <div id="statsBar" class="stats-bar">...</div>
      <p id="selectionHint" class="selection-hint">...</p>
      <section id="keyboardWrap" class="keyboard-wrap">...</section>
      <div id="solveReveal" class="solve-reveal" hidden>...</div>
    </section>
  </main>

  <!-- 2. Toast notification (z-index 20) -->
  <div id="toast" class="toast">...</div>

  <!-- 3. Tutorial overlay (z-index 100, hidden by default) -->
  <div id="tutorialOverlay" class="tutorial-overlay" hidden>
    <div class="tutorial-card">
      <button id="tutorialClose">✕</button>
      <h2>How to Play</h2>
      <p class="tutorial-goal">...</p>
      <div class="tutorial-steps">... 5 steps ...</div>
      <button id="tutorialGotIt">Got it!</button>
    </div>
  </div>
</body>
```

### Inline `<style>` (lines 9-91)
Critical-path CSS for instant rendering: `.app-shell`, `.game-card`, `.quote-panel` structure + matching dark mode overrides. Without these inline styles, there's a flash of unstyled content before `style.css` loads.

**Rule: if you modify layout properties in `style.css`, check the inline `<style>` too.**

---

## Orphaned CSS

The following CSS classes exist in `style.css` but have NO corresponding HTML elements. They are remnants from an earlier design iteration. Safe to remove in a future cleanup:

- `.topbar`, `.topbar h1` — removed title bar
- `.eyebrow` — removed subtitle
- `.streak-pill` — removed streak counter
- `.subhead` — removed subheading bar
- `.meta-row`, `.meta-chip` — removed metadata display
- `.hint-button` (note: different from `.hint-btn`) — old hint button style
- `.result-panel`, `.result-stats`, `.result-chip`, `.result-label`, `.result-actions` — old results panel
- `.action-button`, `.action-button.primary` — old action buttons
- `.reveal-label` — old reveal section label
- `.solved-cipher` — old solved text display
- `.cipher-cell.is-linked` — unused linked state
- `.cipher-cell.is-hinted` — `pop` animation target, but `is-hinted` class is never applied in JS

---

## Source Material

| Item | Location | Notes |
|------|----------|-------|
| Book | Raudat Hidayaat 1 & 2 (رَوْضَة الْهِدَايَة) | Sayings of Syedna Mohammed Burhanuddin (RA) |
| Quotes markdown (Book 1) | `Quotes of Wisdom - Raudat Hidayaat 1.md` (project root) | Source extraction file, in repo |
| Quotes markdown (Book 2) | `Quotes_of_Wisdom_Raudat_Hidayaat_2.md` (Downloads) | Source extraction file |
| Source page images (Book 1) | `Raudat Hidayaat1_pages/` (project root) | Original extractions, gitignored |
| Source page images (Book 2) | `RaudatHidaayaat2/` (Downloads) | Original extractions |
| Deployed page images | `public/hidaayat-ciphers/pages/` | 560 JPGs (Book 1 + 2), committed to repo |

---

## Common Tasks

### Adding New Quotes

1. Add entries to `quotes.json` with `cipher`, `full`, `source`, `page`, and `book` fields
2. Ensure corresponding page image exists in `pages/` (filename: `Raudat Hidayaat {book}-images-{page-1}.jpg`)
3. The game auto-discovers all quotes on load — no registration needed
4. Both **Hidaayat Ciphers** and **Hidaayaat Lookup** share the same `quotes.json` — changes apply to both apps

### Re-enabling Book 3

Book 3 images (171 pages) are already deployed in `pages/`. To re-enable:
1. Obtain a corrected Book 3 markdown with accurate page numbers
2. Parse quotes and append to `quotes.json` with `"book": 3`
3. Verify each quote's `page` field maps to the correct image

### Running Locally

```bash
cd C:\Users\huseinm\Downloads\husein-games
npm start           # Express server on port 3000
# Open http://localhost:3000/hidaayat-ciphers/
```

### Adjusting Hook Length

Change `MAX_WORDS` constant at line ~121 of `cipher.js`. Currently set to 10. Lower = shorter puzzles, higher = more overflow risk on mobile.

### Adjusting Wrong Guess Duration

In `triggerWrongFeedback()` (line ~444), the `setTimeout` delay is 1000ms. The CSS shake animation is 320ms. The delay should be ≥ the shake duration.

### Modifying the Tutorial

The tutorial content is pure HTML in `index.html` (lines 128-197). Each step is a `.tutorial-step` div containing a `.step-num`, `.step-demo` (with animated demo cells), and `.step-text`. CSS for demo cells is in `style.css` (lines ~697-775). To add a step, copy an existing step div and adjust content. No JS changes needed — the tutorial is entirely declarative.

### Adding New Cell States

1. Add the class name to the `renderQuoteGrid()` function with the condition
2. Add CSS rules in `style.css` — both light mode and dark mode sections
3. Check that it doesn't conflict with existing states (especially `is-selected` + `is-cursor` + `is-correct` which can stack)

### Changing the Cursor Visual

The cursor is a `::after` pseudo-element on `.is-cursor` (lines 173-191 in style.css). It's a 16×2.5px gold bar centered at the bottom of the cell with `cursor-blink` animation. To change: modify the pseudo-element dimensions/position/color, or replace with a different indicator (underline, border-bottom, etc).

---

## Key Bug Fixes History

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| **Last word splits across two lines** | `.word-group` had `flex-wrap: wrap` allowing letters within a single word to wrap to the next line | Changed to `flex-wrap: nowrap` on `.word-group`; parent `.quote-grid` (`flex-wrap: wrap`) handles line breaks between word groups |
| **Mobile: dead space above/below, keyboard not at bottom** | `.app-shell` used `min-height: 100dvh` + `align-items: center`, causing content to float in the middle with scroll | Changed to `height: 100dvh` + `align-items: stretch`; game card fills viewport; keyboard pinned via `flex-shrink: 0` |
| **Cells clipped at card edges on mobile** | `.quote-grid` horizontal padding was only 6px, not enough buffer with card border + inner gold inset | Increased to 12px padding + `box-sizing: border-box` |
| **Wrong guesses stayed displayed, selection advanced** | `assignPlainLetter()` always persisted the assignment and advanced to next cipher, even for wrong guesses | Wrong path now returns early after `triggerWrongFeedback()`, which auto-clears after 1s and keeps selection on same cipher |
| **Long quotes overflow cipher grid** | 8 quotes (140–225 chars) had too many cells for mobile screens | Implemented hook+reveal: `hookQuote()` truncates to first 10 words + `...`; full quote shown on book page after solving |
| **Selection jumps to wrong instance after solving** | Only `selectedCipher` (letter) was tracked, not which cell was tapped. `getFirstUnresolvedCipher()` scanned from start of unique letters array, not from user's position | Added `selectedPos` (flat token index), `data-pos` on cells, `is-cursor` class. `getFirstUnresolvedCipher()` now scans forward from cursor position in reading order |
| **Book page image fails to load after solving** | Image filenames have spaces (`Raudat Hidayaat 1-images-X.jpg`) — unencoded in `src` attribute, intermittent mobile failures | URL-encode spaces as `%20`, add `onerror` retry with cache-busting param, preload image at puzzle creation time |
| **Info button (?) peeks through reveal overlay** | Both `.info-btn` and `.solve-reveal` had `z-index: 10` | Hide info button (`hidden = true`) during reveal in `render()` |
| **Triple nested rectangle borders on reveal** | `.solve-reveal` had `inset: 18px` (gap from card) + `.page-image` had its own `border` | Changed to `inset: 0` (fills entire card), removed image border/shadow |
| **"Wisdom Revealed" toast covers Next Puzzle button** | Toast appeared at bottom of reveal overlay, overlapping the button | Removed the toast call from `completePuzzle()` |
| **Long words (e.g., EXTRAVAGANCE) overflow on mobile** | Fixed cell width (34px) × 12+ letters exceeded narrow screen width | Dynamic `--cell-w` CSS variable computed in JS based on longest word; cells use `flex-shrink: 1` + `min-width: 0` |

---

## Implementing New Features — Guide

When starting a new session to add features, read this checklist:

1. **Read this doc first** — it has the complete architecture, state model, and design rationale
2. **Check `index.html` inline styles** if changing any layout — the inline `<style>` and `style.css` both define core layout classes
3. **Both light and dark mode** — every new visual element needs CSS in both the default rules AND the `@media (prefers-color-scheme: dark)` block
4. **All responsive breakpoints** — test at 400px width, 760px height, and 720px+ width. Add rules in the breakpoint sections if needed
5. **State goes in `state` object** — no global variables. Use existing patterns (e.g., `state.selectedPos` for cursor)
6. **DOM caching** — new elements must be added to `cacheElements()` and accessed via `state.elements.foo`
7. **Event binding** — add to `bindEvents()`, not inline onclick handlers
8. **Render cycle** — all visual updates go through `render()` → sub-renderers. Don't manipulate DOM outside render functions
9. **Git push** — use browser credential manager, NOT `gh` CLI (linked to work account). Standard flow: `git add -A && git commit -m "..." && git push origin main`
10. **The `.word-group` must stay `flex-wrap: nowrap`** — this is the #1 cause of the word-splitting bug. Never change this. Long words are handled by dynamic cell sizing (`--cell-w` variable) and `flex-shrink`, not by wrapping.
