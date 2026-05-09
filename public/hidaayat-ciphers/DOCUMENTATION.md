# Hidaayat Ciphers — Developer Documentation

> **Parent doc**: [../../DOCUMENTATION.md](../../DOCUMENTATION.md) (project-wide architecture, deployment, common tasks)

---

## Overview

A substitution cipher puzzle game built around wisdom quotes from **Raudat Hidayaat 1** (رَوْضَة الْهِدَايَة) — a collection of sayings of Syedna Mohammed Burhanuddin (RA). Players decode encrypted quotes letter-by-letter, then see the original Arabic manuscript page upon solving. Purely static, single-player, no server logic.

**Core loop:** See cipher → tap cell → pick real letter → green = correct, shake + auto-clear = wrong → solve all → book page reveal.

---

## Files

```
public/hidaayat-ciphers/
├── index.html              # Game shell (~126 lines) — inline critical CSS for fast first paint
├── cipher.js               # Game engine (~491 lines) — all logic, state, rendering, events
├── style.css               # Styling (~723 lines) — navy/gold/cream theme, dark mode, responsive
├── quotes.json             # 78 quotes with page numbers (~21.5KB)
├── pages/                  # 243 book page JPGs (~68MB, committed to repo)
│   └── Raudat Hidayaat 1-images-{0-242}.jpg
└── DOCUMENTATION.md        # This file
```

**No build step.** Everything is vanilla JS/CSS served statically by the Express server.

---

## Gameplay Mechanics

### Starting a Puzzle
1. On page load, `init()` fetches `quotes.json`, picks a random quote (seeded by `Date.now()`), generates a derangement cipher
2. Each reload gives a new random puzzle — no daily rotation, no streak tracking
3. The first unresolved cipher letter is auto-selected

### Solving Flow
1. **Tap a cipher cell** (top label = cipher letter, bottom = your guess) to select it
2. **Tap a keyboard letter** to assign it as the decoded letter
3. **Correct guess**: cell turns green, selection auto-advances to next unresolved cipher
4. **Wrong guess**: cell turns pink + shakes for 1 second, then **auto-clears** the wrong assignment and keeps selection on the same cipher — player retries without manually clearing
5. **Hint button**: reveals the correct letter for the selected (or first unresolved) cipher cell
6. **Backspace (⌫)**: clears the assignment on the currently selected cell
7. **Physical keyboard**: typing A-Z assigns letters, Backspace/Delete clears

### Letter Exclusivity
Each plain letter can only be assigned to one cipher letter at a time. If you assign "T" to cipher "X", and "T" was already assigned to cipher "Q", the assignment is silently moved — cipher "Q" is cleared.

### Hook + Reveal (Long Quotes)
Quotes longer than 10 words are truncated to the first 10 words with `...` appended. The `...` passes through as punctuation tokens (not cipher letters). After solving, the post-solve reveal shows the complete quote via the book page image.

- `hookQuote(text)` in `cipher.js` (line ~107) handles truncation
- `state.isPartial` flag tracks whether the current quote was truncated
- All 78 quotes remain in the pool — long ones just get hook-truncated

### Scoring
- **Progress**: X / Y unique cipher letters correctly solved (displayed in stats bar)
- **Mistakes**: incremented each time a wrong letter is assigned (even though it auto-clears)
- **Hints used**: incremented each time the Hint button is pressed

### Post-Solve Reveal
On completing the puzzle:
1. All gameplay UI hides (quote panel, keyboard, stats, hint bar)
2. A full-screen overlay appears inside the game card (z-index 10)
3. Shows: score line ("Solved with X mistakes · Y hints") + book page image + "Next Puzzle ▸" button
4. The book page image maps: `page N → ./pages/Raudat Hidayaat 1-images-{N-1}.jpg` (0-indexed)

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
  quotes: [],           // All 78 quotes loaded from JSON
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
  selectedCipher: null, // Currently selected cipher letter
  wrongCipher: null,    // Cipher letter currently showing wrong feedback (auto-clears)
  revealVisible: false, // Show post-solve overlay
  toastId: null,        // setTimeout ID for toast auto-hide
  elements: {}          // Cached DOM references (14 elements)
}
```

### Function Reference

| Function | Lines | Purpose |
|----------|-------|---------|
| `init()` | 27–43 | Entry point. Fetches quotes.json, builds puzzle, hydrates progress, renders |
| `cacheElements()` | 46–65 | Caches 14 DOM references into `state.elements` |
| `bindEvents()` | 68–97 | Event delegation: quote grid clicks, keyboard clicks, physical keydown, hint, next puzzle |
| `startNewPuzzle()` | 99–103 | Builds fresh puzzle and resets progress (called by "Next Puzzle" button) |
| `hookQuote(text)` | 107–111 | Truncates quotes > 10 words to first 10 + `...`. Returns `{ hook, isPartial }` |
| `buildDailyPuzzle()` | 113–136 | Picks random quote (seeded by `Date.now()`), generates derangement, tokenizes words |
| `hydrateProgress()` | 138–142 | Initializes fresh progress state, selects first unresolved cipher |
| `normalizeProgress()` | 144–152 | Sanitizes saved progress from localStorage (uppercase validation) |
| `persistProgress()` | 154–158 | Saves current progress to localStorage under `state.dateKey` |
| `render()` | 160–182 | Master render — toggles gameplay vs reveal, dispatches to sub-renderers |
| `renderQuoteGrid()` | 184–228 | Builds cipher cell DOM — word groups with letter cells and punctuation |
| `renderKeyboard()` | 230–277 | Builds QWERTY keyboard with state classes (correct/active/used/occupied) |
| `renderSelectionHint()` | 279–289 | Shows contextual hint text below stats bar |
| `renderStats()` | 291–300 | Updates progress counter, mistakes, hints used |
| `useHint()` | 302–327 | Reveals correct letter for selected/first-unresolved cipher. Clears conflicting assignments |
| `renderReveal()` | 329–336 | Sets book page image src and score text |
| `selectCipher()` | 338–343 | Sets selected cipher on cell tap, vibrates, re-renders |
| `assignPlainLetter()` | 345–371 | Core gameplay. Assigns guess, checks correctness. Correct → advance. Wrong → shake + auto-clear |
| `removeAssignment()` | 374–381 | Clears assignment on selected cipher (⌫ handler) |
| `completePuzzle()` | 384–395 | Marks solved, triggers reveal overlay after 300ms delay |
| `isPuzzleSolved()` | 397–398 | Checks if all unique cipher letters have correct assignments |
| `getFirstUnresolvedCipher()` | 401–411 | Finds next unresolved cipher letter (wraps around from current position) |
| `triggerWrongFeedback()` | 413–426 | Shows wrong state for 1s, then auto-clears assignment and keeps selection |
| `showToast()` | 428–433 | Shows/auto-hides toast message (1.8s) |
| `findAssignedCipher()` | 435–437 | Reverse lookup: which cipher letter has this plain letter assigned? |
| `buildToken()` | 439–447 | Converts a character to a cipher token `{ type: 'letter'|'punct', ... }` |
| `generateDerangement()` | 449–460 | Fisher-Yates shuffle constrained to derangement (no letter maps to itself) |
| `invertMapping()` | 462 | Creates reverse mapping (plain→cipher ↔ cipher→plain) |
| `mulberry32()` | 464–471 | Deterministic 32-bit PRNG for reproducible shuffles |
| `loadStorage()` / `saveStorage()` | 479–486 | localStorage read/write with error handling |
| `vibrate()` / `wait()` / `clamp()` | 488–491 | Utility: haptic feedback, promise delay, number clamping |

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
      - persistProgress() + render() (cell goes back to empty, same cell selected)
   e. RETURN (don't advance to next cipher)
7. If CORRECT:
   a. persistProgress()
   b. Check isPuzzleSolved() → completePuzzle() if yes
   c. state.selectedCipher = getFirstUnresolvedCipher(C) (advance to next)
   d. render()
```

**Why auto-clear wrong guesses?** The player is trying to solve a specific cipher letter. A wrong guess shouldn't leave visual clutter or force manual cleanup. Show the mistake briefly (so they learn), then clear it so they can try again immediately.

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
└── .game-card (height: 100%, flex column, 14px padding, 6px gap)
    ├── .quote-panel (flex: 1 1 auto, min-height: 0) ← fills available space
    │   └── .quote-grid (flex-wrap: wrap, overflow-y: auto, padding: 4px 12px)
    │       └── .word-group × N (flex-wrap: nowrap) ← each word is one group
    │           └── .cipher-cell × N (34×50px grid cells)
    ├── .stats-bar (flex-shrink: 0) ← progress, mistakes, hints, Hint button
    ├── .selection-hint (flex-shrink: 0) ← contextual text
    ├── .keyboard-wrap (flex-shrink: 0) ← QWERTY keyboard pinned at bottom
    │   └── .keyboard (grid, 3 rows)
    │       └── .key-button × 26 + backspace
    └── .solve-reveal (position: absolute, inset: 18px, z-index: 10) ← post-solve overlay
```

**Critical layout rules:**
- `.word-group` must be `flex-wrap: nowrap` — keeps all letters of a single word together. The parent `.quote-grid` (`flex-wrap: wrap`) handles line breaks between word groups.
- `.quote-panel` gets `flex: 1 1 auto; min-height: 0` so it takes available space but shrinks for keyboard.
- `.keyboard-wrap`, `.stats-bar`, `.selection-hint` all have `flex-shrink: 0` — they never compress.
- `.app-shell` uses `height: 100dvh` (not `min-height`) to prevent scroll and ensure keyboard is always visible.

### Inline CSS vs External CSS

`index.html` has inline `<style>` for critical-path rendering (app-shell, game-card, quote-panel structure + dark mode). `style.css` provides the full theme. This split prevents a flash of unstyled content.

**If you change layout in `style.css`, check `index.html` inline styles too** — both define `.game-card`, `.quote-panel`, and `.app-shell` properties. The inline styles load first; external CSS overrides/extends them.

### Cell States (CSS Classes)

| Class | Applied when | Visual |
|-------|-------------|--------|
| `.is-empty` | No assignment for this cipher | Transparent bottom + underline placeholder |
| `.is-selected` | This cipher is currently selected | Gold border + subtle glow |
| `.is-correct` | Assignment matches the real letter | Green background + green border shadow |
| `.is-wrong` | Wrong assignment (temporary, 1s) | Pink/red background + shake animation |

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
| Default | Mobile-first | 34×50px cells, 14px card padding |
| `max-height: 760px` | Short screens | 30×44px cells, 10px padding, 40px keyboard keys |
| `max-width: 400px` | Narrow phones | 28×42px cells, 8px padding, 6px shell padding, 18px card radius |
| `min-width: 720px` | Desktop | Card capped at 860px height, centered in viewport |

### Dark Mode

Full `prefers-color-scheme: dark` support via CSS custom properties. Both inline styles (index.html) and external CSS (style.css) have matching dark mode overrides. Key changes: navy becomes gold borders, cells get semi-transparent white backgrounds, toast inverts to cream-on-dark.

### Animations

- `shake` (320ms): horizontal oscillation for wrong guesses — ±3px, ±2px
- `pop` (420ms): scale pulse for hint reveals — 1.0 → 1.08 → 1.0

---

## Data Format

### quotes.json

```json
[
  {
    "cipher": "The bane of beauty is vanity.",
    "full": "The bane of beauty is vanity.",
    "source": "Rasulullah (SA)",
    "page": 15
  }
]
```

| Field | Purpose |
|-------|---------|
| `cipher` | The quote text used for the puzzle (identical to `full` for all quotes currently) |
| `full` | The complete quote text |
| `source` | Attribution (speaker/author) |
| `page` | Book page number — maps to image via `page - 1` (0-indexed filenames) |

**Stats:** 78 quotes, 27–225 characters, median ~70 characters, 8 quotes exceed 10 words (get hook-truncated).

### Image Mapping

Book page N → `./pages/Raudat Hidayaat 1-images-{N-1}.jpg`

Example: Page 15 → `Raudat Hidayaat 1-images-14.jpg`

243 JPGs totaling ~68MB, committed to the repo (needed for the live site). The source images were originally in `Raudat Hidayaat1_pages/` (project root, gitignored).

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
| Book | Raudat Hidayaat 1 (رَوْضَة الْهِدَايَة) | Sayings of Syedna Mohammed Burhanuddin (RA) |
| Quotes markdown | `Quotes of Wisdom - Raudat Hidayaat 1.md` (project root) | Source extraction file, untracked |
| Source page images | `Raudat Hidayaat1_pages/` (project root) | Original extractions, gitignored |
| Deployed page images | `public/hidaayat-ciphers/pages/` | 243 JPGs, committed to repo |

---

## Common Tasks

### Adding New Quotes

1. Add entries to `quotes.json` with `cipher`, `full`, `source`, and `page` fields
2. Ensure corresponding page image exists in `pages/` (filename: `Raudat Hidayaat 1-images-{page-1}.jpg`)
3. The game auto-discovers all quotes on load — no registration needed

### Running Locally

```bash
cd C:\Users\huseinm\Downloads\husein-games
npm start           # Express server on port 3000
# Open http://localhost:3000/hidaayat-ciphers/
```

### Adjusting Hook Length

Change `MAX_WORDS` constant at line 105 of `cipher.js`. Currently set to 10. Lower = shorter puzzles, higher = more overflow risk on mobile.

### Adjusting Wrong Guess Duration

In `triggerWrongFeedback()` (line ~413), the `setTimeout` delay is 1000ms. The CSS shake animation is 320ms. The delay should be ≥ the shake duration.

---

## Key Bug Fixes History

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| **Last word splits across two lines** | `.word-group` had `flex-wrap: wrap` allowing letters within a single word to wrap to the next line | Changed to `flex-wrap: nowrap` on `.word-group`; parent `.quote-grid` (`flex-wrap: wrap`) handles line breaks between word groups |
| **Mobile: dead space above/below, keyboard not at bottom** | `.app-shell` used `min-height: 100dvh` + `align-items: center`, causing content to float in the middle with scroll | Changed to `height: 100dvh` + `align-items: stretch`; game card fills viewport; keyboard pinned via `flex-shrink: 0` |
| **Cells clipped at card edges on mobile** | `.quote-grid` horizontal padding was only 6px, not enough buffer with card border + inner gold inset | Increased to 12px padding + `box-sizing: border-box` |
| **Wrong guesses stayed displayed, selection advanced** | `assignPlainLetter()` always persisted the assignment and advanced to next cipher, even for wrong guesses | Wrong path now returns early after `triggerWrongFeedback()`, which auto-clears after 1s and keeps selection on same cipher |
| **Long quotes overflow cipher grid** | 8 quotes (140–225 chars) had too many cells for mobile screens | Implemented hook+reveal: `hookQuote()` truncates to first 10 words + `...`; full quote shown on book page after solving |
