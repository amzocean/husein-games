# Hidaayat Ciphers

A substitution cipher puzzle game built around wisdom quotes from **Raudat Hidayaat 1** — a collection of sayings of Syedna Mohammed Burhanuddin (RA). Players decode encrypted quotes by mapping cipher letters to their real counterparts, then see the original Arabic book page upon solving.

## How It Works

### Gameplay
1. A random wisdom quote is selected and encrypted using a **substitution cipher** (derangement — no letter maps to itself)
2. The player sees cipher letters (top of each cell) and must guess the real letter (bottom)
3. Tap a cipher cell to select it, then tap the keyboard letter you think it maps to
4. **Green cells** = correct mapping, **pink cells** = wrong guess, **white cells** = not yet filled
5. The keyboard mirrors these states: green keys are confirmed correct, dimmed keys are already used
6. On solving, a **full-screen reveal** shows the original book page with the Arabic quote and English translation

### Hook + Reveal (Long Quotes)
Quotes longer than 10 words are truncated to the first 10 words with `...` appended. The player solves just this "hook" portion. After solving, the post-solve reveal shows the complete quote on the book page image.

### Scoring
- **Progress**: X / Y unique cipher letters solved
- **Mistakes**: counted each time a wrong letter is assigned
- **Hints**: unlimited — reveals the correct letter for the selected (or first unresolved) cipher cell

## Architecture

### Files

```
public/hidaayat-ciphers/
├── index.html          # Game shell (~120 lines) — inline critical CSS for fast first paint
├── cipher.js           # Game engine (~475 lines) — all logic, state, rendering
├── style.css           # Styling (~710 lines) — navy/gold/cream theme, dark mode, responsive
├── quotes.json         # 78 quotes with page numbers (~21.5KB)
├── pages/              # 243 book page JPGs (~68MB, committed to repo)
│   └── Raudat Hidayaat 1-images-{0-242}.jpg
└── README.md           # This file
```

### Tech Stack
- **Pure vanilla JS** — no frameworks, no build step, no dependencies
- **Static client-side app** — served by the existing Express server at port 3000
- **No server-side logic** — all game state is client-side (localStorage for progress)

### Key Components

#### `cipher.js` — Game Engine

| Function | Purpose |
|----------|---------|
| `init()` | Fetches quotes.json, builds puzzle, hydrates progress, first render |
| `buildDailyPuzzle()` | Picks random quote (seeded by `Date.now()`), generates derangement cipher, tokenizes words |
| `hookQuote(text)` | Truncates quotes > 10 words to first 10 words + `...` |
| `hydrateProgress()` | Initializes fresh progress state (assignments, mistakes, hints) |
| `render()` | Master render — toggles between gameplay and reveal overlay |
| `renderQuoteGrid()` | Builds cipher cell DOM — word groups with letter cells and punctuation |
| `renderKeyboard()` | Builds QWERTY keyboard with state classes (correct/active/used/occupied) |
| `renderStats()` | Updates progress counter, mistakes, hints used |
| `renderSelectionHint()` | Shows contextual hint text below stats |
| `renderReveal()` | Sets book page image source and score text |
| `assignPlainLetter()` | Core gameplay — assigns a guess, checks correctness, increments mistakes if wrong |
| `useHint()` | Reveals correct letter for selected/first-unresolved cipher |
| `completePuzzle()` | Marks solved, triggers reveal after 300ms delay |
| `generateDerangement()` | Fisher-Yates shuffle constrained to derangement (no fixed points) |
| `mulberry32()` | Deterministic 32-bit PRNG for reproducible shuffles |
| `buildToken()` | Converts a character to a cipher token (letter or punctuation) |

#### State Object

```js
state = {
  quotes: [],           // All 78 quotes from JSON
  quote: null,          // Current quote object { cipher, full, source, page }
  puzzle: null,         // { words, plainToCipher, cipherToPlain, uniqueCipherLetters }
  quoteIndex: 0,        // Index into quotes array
  isPartial: false,     // True if quote was truncated (hook mode)
  progress: {
    assignments: {},    // { cipherLetter: guessedPlainLetter }
    solved: false,
    mistakes: 0,
    hintsUsed: 0
  },
  selectedCipher: null, // Currently selected cipher letter
  revealVisible: false, // Show post-solve overlay
  elements: {}          // Cached DOM references
}
```

#### CSS Architecture

- **Theme variables**: Navy (#1a2744), gold (#c9944a), cream (#f5f0e8) palette
- **Layout**: Flex column — quote panel fills available space, keyboard pinned to bottom
- **Cell states via CSS classes**: `.is-empty`, `.is-correct`, `.is-wrong`, `.is-selected`
- **Keyboard states**: `.is-correct` (green), `.is-active` (gold), `.is-used` (dimmed), `.is-occupied`
- **Solve overlay**: Absolute positioned inside game-card, z-index 10, shows page image fullscreen
- **Responsive breakpoints**: 400px (narrow phones), 760px (short screens), 720px+ (desktop)
- **Dark mode**: Full `prefers-color-scheme: dark` support

### Data Format

#### quotes.json
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

- `cipher`: The quote text used for the puzzle (may be full or hook portion)
- `full`: The complete quote (same as cipher for short quotes)
- `source`: Attribution
- `page`: Book page number — maps to image filename via `page - 1` (0-indexed images)

#### Image Mapping
Book page N → `./pages/Raudat Hidayaat 1-images-{N-1}.jpg`

Example: Page 15 → `Raudat Hidayaat 1-images-14.jpg`

### Source Material
- **Book**: Raudat Hidayaat 1 (رَوْضَة الْهِدَايَة)
- **Quotes file**: `Quotes of Wisdom - Raudat Hidayaat 1.md` (project root)
- **Page images**: `Raudat Hidayaat1_pages/` (project root, copied to `public/hidaayat-ciphers/pages/`)
- **Image count**: 243 JPGs (~68MB total) — committed to repo

## Development

### Running Locally
```bash
npm start           # Starts Express server on port 3000
# Open http://localhost:3000/hidaayat-ciphers/
```

### Page Images
The 243 page images (~68MB) are committed to the repo and deployed with the site. The source images were originally extracted from `Raudat Hidayaat1_pages/` (gitignored).

### Adding New Quotes
1. Add entries to `quotes.json` with `cipher`, `full`, `source`, and `page` fields
2. Ensure corresponding page image exists in `pages/` directory
3. The game auto-discovers all quotes on load

### Clearing Game State
```js
localStorage.removeItem('wisdom-cipher-state-v1');
location.reload();
```

## Design Decisions

1. **Random-on-reload** (not daily): Each page refresh gives a new puzzle. No date-seeding — the game is for personal reflection, not competitive daily streaks.

2. **Hook truncation at 10 words**: Long quotes (up to 225 chars) would overflow the cipher grid on mobile. Instead, only the first 10 words are shown as the puzzle, with `...` indicating continuation. The full quote is on the book page shown after solving.

3. **All caps display**: Decoded letters display in uppercase for visual consistency and readability on small cipher cells.

4. **Unlimited hints**: No hint limit — the game is meditative, not punitive. Hints used are tracked in the score for self-assessment.

5. **Derangement cipher**: The substitution cipher is guaranteed to have no fixed points (no letter maps to itself), ensuring every letter must be decoded.

6. **Post-solve book page reveal**: After solving, the player sees the actual Arabic manuscript page containing the quote — connecting the puzzle to its spiritual source.
