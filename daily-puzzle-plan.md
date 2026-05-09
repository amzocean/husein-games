# Daily Puzzle — Love Cipher & Pixel Art Nonogram

## Concept

A **single daily puzzle page** at `/daily` that alternates between two game types:

- **Odd days** → **Love Cipher** (cryptogram)
- **Even days** → **Pixel Art Nonogram** (picross)

Both are deterministic from the date (no server state needed). Each puzzle ends with a romantic reveal — a quote for cipher, an image + related quote for nonogram.

Live at: `huseinlovesyou.com/daily`

---

## Game 1: Love Cipher (Cryptogram)

### How it works
- A romantic quote is encrypted with a random letter substitution (seeded by date)
- Player taps a cipher letter, then taps the real letter they think it maps to
- Correct letters lock in with a soft glow; wrong guesses shake
- When fully decoded, the quote reveals with a flourish animation + author attribution
- Track: time taken, hints used

### UX flow
1. Open page → see encrypted text with blanks below each letter
2. Tap cipher letter → keyboard/letter-picker appears
3. Assign a real letter → all instances of that cipher letter fill in
4. Optional hint button (reveals one letter, max 3 hints)
5. Solve → quote animates in with romantic styling, confetti/hearts
6. Share button: "I decoded today's love letter in 2:34 with 1 hint 💌"

### Quote pool
- ~200 romantic quotes (mix of famous + personal messages from Husein)
- Stored as a JSON array in the source
- Day number (days since epoch) mod pool size = today's quote
- Quotes 8-15 words ideal (not too short, not overwhelming)

### Daily uniqueness — reuse tiles' date seeding pattern
- Reuse `mulberry32` seeded PRNG from `renderer.js` (same implementation)
- Date string: `new Date().toISOString().slice(0, 10)` → `"YYYY-MM-DD"` (same as `photos.js`)
- Seed generation: hash the date string into a 32-bit integer for mulberry32
  ```js
  function dateSeed(dateStr) {
    let h = 0;
    for (let i = 0; i < dateStr.length; i++) {
      h = Math.imul(31, h) + dateStr.charCodeAt(i) | 0;
    }
    return h;
  }
  const rng = mulberry32(dateSeed('2026-05-08'));
  ```
- Quote index: `Math.floor(rng() * quotes.length)` — deterministic per day
- Cipher substitution: use `rng` to shuffle A-Z mapping — same puzzle for everyone on same day
- Extract `mulberry32` + `dateSeed` into a shared `daily-seed.js` module used by both cipher and nonogram

---

## Game 2: Pixel Art Nonogram (Picross)

### How it works
- A grid (typically 8x8 or 10x10) with row/column number clues
- Player fills cells to reveal a hidden pixel art image
- Tap to fill, long-press/right-click to mark X (definitely empty)
- When solved, the pixel art animates into a colored version + a quote related to the image appears

### UX flow
1. Open page → see empty grid with clue numbers on left + top
2. Tap cells to fill (dark) or mark empty (X)
3. Row/column clues gray out when satisfied
4. Solve → grid transforms: black cells become colored pixel art, smooth transition
5. Below the art: a romantic quote related to the image theme
6. Share button: "I solved today's pixel art in 3:12 🎨"

### Puzzle pool
- ~100 puzzles, each defined as: grid data (binary matrix), color map, theme name, related quote
- Themes: heart, rose, ring, star, moon, cat, house, umbrella (couple), coffee cup, sunset, infinity symbol, key, lock, butterfly, crown, diamond
- Each puzzle hand-crafted or generated, stored as compact JSON
- Day number mod pool size = today's puzzle

### Difficulty
- Start with 5x5 (easy, ~1 min) for first few puzzles in rotation
- Mix of 5x5, 8x8, and occasional 10x10
- No ambiguous puzzles — every puzzle must have exactly one logical solution

### Daily uniqueness — same seed pattern as cipher
- Uses shared `mulberry32` + `dateSeed` from `daily-seed.js`
- Puzzle index: `Math.floor(rng() * puzzles.length)` — deterministic per day
- Colored reveal is the reward — during solving it's just black/white grid

---

## Alternating Schedule

```
Day 1 (odd)  → Cipher
Day 2 (even) → Nonogram
Day 3 (odd)  → Cipher
Day 4 (even) → Nonogram
...
```

Uses the same date string from tiles (`YYYY-MM-DD`). Compute day number:
```js
const today = new Date().toISOString().slice(0, 10);
const epoch = new Date('2025-01-01');
const dayNum = Math.floor((new Date(today) - epoch) / 86400000);
const isCipher = dayNum % 2 === 1;
```

The page header shows which game type it is today + a "tomorrow's game" teaser.

---

## Shared UI/UX

### Page structure
- Same romantic pink/gold theme as rest of the site (Playfair Display + Inter)
- Header: "Daily Puzzle 💌" + date + game type badge (Cipher/Nonogram)
- Timer (counts up, shown but not stressful)
- Hint button (cipher: reveals a letter; nonogram: reveals a row)
- Completion modal with quote reveal + share button + "See you tomorrow ❤️"
- Footer link back to Game Room

### Completion state
- Save completion to localStorage per date — if revisited same day, show the solved state
- No server-side persistence needed (stateless, all client-side)
- Streak counter: "🔥 7-day streak!" tracked in localStorage

### Mobile-First Interface Design

The entire game is designed phone-first (375px width baseline). No scrolling during gameplay — everything fits in one viewport.

#### Screen Layout (both games)

```
┌──────────────────────────┐
│  💌 Daily Love Cipher    │  ← Header: title + date + streak
│  May 8, 2026  🔥3        │
├──────────────────────────┤
│                          │
│                          │
│    [ PUZZLE AREA ]       │  ← 60% of viewport height
│                          │
│                          │
├──────────────────────────┤
│  ⏱️ 1:24    💡 Hint (2)  │  ← Status bar: timer + hint button
├──────────────────────────┤
│                          │
│   [ INPUT AREA ]         │  ← 30% of viewport — letter picker or mode toggle
│                          │
└──────────────────────────┘
```

Uses CSS `dvh` (dynamic viewport height) to avoid iOS Safari bottom bar issues.
No system keyboard ever opens — all input is custom UI.

---

#### Love Cipher — Mobile UX Detail

**Puzzle area (top 60%):**
```
┌──────────────────────────┐
│  Bx  onn  ius  yrhng     │  ← Cipher text (uppercase, spaced)
│  __  ___  ___  _____     │  ← Answer slots below each letter
│                          │
│  iushs  bm  xr  usohir  │
│  _h___  __  __  _____r   │  ← Solved letters fill in green
│                          │
│  prh  as  nbvs  wrhxm    │
│  ___  __  ____  ____s    │
└──────────────────────────┘
```

- Each cipher letter is a **tappable pill** (min 40px wide, 48px tall)
- Tapping a cipher letter highlights ALL instances of that letter in the quote (pulsing border)
- Already-solved letters show in green with a soft glow
- Wrong-guess letters shake and flash red briefly
- The cipher text wraps naturally by word — no horizontal scroll

**Letter picker (bottom 30%) — always visible, no keyboard popup:**
```
┌──────────────────────────┐
│  Q  W  E  R  T  Y  U  I │  ← QWERTY layout, familiar
│  A  S  D  F  G  H  J  K │     Each key is 36x44px min
│  ⌫  Z  X  C  V  B  N  M │  ← Backspace to unassign
└──────────────────────────┘
```

- QWERTY layout (familiar muscle memory)
- Letters already used show **dimmed** with the cipher letter they map to (e.g., "A→R" in small text)
- Tap flow: tap cipher letter above → tap real letter below → assignment made
- If a letter is already assigned, tapping a new one replaces it (with undo option)
- **Backspace key (⌫)**: unassign the currently selected cipher letter
- Keys have subtle haptic feedback on tap (via `navigator.vibrate(10)`)

**Interaction states:**
1. Nothing selected → all cipher letters are white pills
2. Cipher letter tapped → that letter + all its instances pulse pink, picker is active
3. Real letter tapped → assignment made, all instances fill in, auto-advance to next unsolved letter
4. Auto-advance: after assigning, the next unsolved cipher letter auto-selects (left-to-right, top-to-bottom) — keeps flow going without extra taps

---

#### Pixel Art Nonogram — Mobile UX Detail

**Puzzle area (top 65%):**
```
┌──────────────────────────┐
│      1  2     1          │  ← Column clues (top)
│      1  1  3  2  1       │
│  ──────────────────      │
│  2 1 │░░│  │░░│░░│  │   │  ← Row clues (left) + grid
│    3 │  │░░│░░│░░│  │   │
│  1 1 │░░│  │  │  │░░│   │
│    5 │░░│░░│░░│░░│░░│   │
│    1 │  │  │░░│  │  │   │
└──────────────────────────┘
```

- Grid sizes: 5x5 (easy), 8x8 (medium), 10x10 (hard)
- **Cell sizing**: grid fills available width minus clue space
  - 5x5: cells ~56px (very comfortable)
  - 8x8: cells ~38px (comfortable)
  - 10x10: cells ~30px (tight but workable — enable pinch zoom)
- Minimum touch target: 30px (Apple HIG minimum)
- Clue numbers use 12px font, positioned in the gutter

**Input area (bottom 25%) — mode toggle + controls:**
```
┌──────────────────────────┐
│  ┌─────────┬─────────┐   │
│  │  ■ Fill  │  ✕ Mark │   │  ← Toggle: fill vs mark-empty
│  └─────────┴─────────┘   │
│                          │
│  [ Undo ↩ ]  [ Check ✓ ] │  ← Undo last + check progress
└──────────────────────────┘
```

- **Two-mode toggle** (like a segmented control):
  - **Fill mode (■)**: tap cells to fill them (dark)
  - **Mark mode (✕)**: tap cells to mark as definitely empty
  - Active mode has pink highlight — always clear which mode you're in
- **No long-press needed** — long-press is unreliable on mobile; explicit mode toggle is cleaner
- **Drag to fill**: touch-and-drag across cells fills/marks multiple cells in one gesture (same mode)
- **Undo button**: reverts last action (keeps a stack of last 20 moves)
- **Check button** (optional): highlights any incorrect fills in red briefly (costs 1 hint)

**Grid interaction:**
- Tap a cell → fills or marks based on current mode
- Drag across cells → fills/marks a line (horizontal or vertical, snaps to axis)
- Satisfied clues dim out (gray text) — instant visual feedback
- Pinch-to-zoom enabled for 10x10 grids (uses CSS transform, not layout reflow)

**Solve reveal animation:**
1. All cells correct → brief pause (300ms)
2. Grid cells morph from black → colored pixel art (staggered, top-left to bottom-right, 50ms per cell)
3. Grid zooms to center of screen
4. Below: quote fades in with typewriter effect
5. Confetti/hearts particle effect

---

#### Completion Modal (both games)

```
┌──────────────────────────┐
│                          │
│      ✨ Solved! ✨        │
│                          │
│  "In all the world,     │
│   there is no heart      │
│   for me like yours."    │
│        — Maya Angelou    │
│                          │
│  ⏱️ 2:34  💡 1 hint      │
│  🔥 3-day streak!        │
│                          │
│  ┌────────────────────┐  │
│  │   📋 Share Result   │  │  ← Copies emoji summary
│  └────────────────────┘  │
│                          │
│  See you tomorrow ❤️     │
│  Tomorrow: Pixel Art 🎨  │
└──────────────────────────┘
```

- Full-screen overlay with blur backdrop
- Quote in large Playfair Display italic
- Share button uses `navigator.clipboard.writeText()` + `navigator.share()` on mobile
- "Tomorrow" teaser shows which game type is next

---

#### Responsive Breakpoints

| Width | Grid cell size | Cipher pill width | Layout |
|-------|---------------|-------------------|--------|
| < 375px | Scale down 90% | 36px min | Single column |
| 375-428px | Optimal (as designed) | 40px | Single column |
| 429-768px | Larger cells, more padding | 48px | Single column, wider margins |
| > 768px | Max 500px game width, centered | 52px | Centered card with border |

Desktop gets a centered card (max-width 500px) with subtle shadow — the game is phone-sized even on desktop, like Wordle.

---

#### Touch Accessibility

- All interactive elements ≥ 44x44px (WCAG 2.5.8 target size)
- High contrast: dark text on white/cream background, pink (#c44569) for accents
- No color-only indicators — filled cells use both color AND a subtle inner dot pattern
- Nonogram mark (✕) is visually distinct from fill (■) even in grayscale
- Timer is informational only — no pressure, no penalty for slow solving

### Share format
Emoji-based (like Wordle):
- Cipher: `💌 Daily Love Cipher #142 — 2:34 ⏱️ 1💡 huseinlovesyou.com/daily`
- Nonogram: `🎨 Daily Pixel Art #143 — 3:12 ⏱️ 0💡 huseinlovesyou.com/daily`

---

## Technical Architecture

### File structure
```
public/daily/
  index.html          # Main page — detects day, loads correct game
  cipher.js           # Cipher game engine + UI
  nonogram.js         # Nonogram game engine + UI
  puzzles-cipher.json # ~200 quotes
  puzzles-nono.json   # ~100 nonogram grids with colors + quotes
  style.css           # Shared styling
```

### No server changes needed
- Purely static files served by Express's existing `express.static`
- No Socket.IO, no server state
- All puzzle selection is client-side via date-seeded index

### Puzzle data format

**Cipher (`puzzles-cipher.json`):**
```json
[
  { "quote": "In all the world, there is no heart for me like yours.", "author": "Maya Angelou" },
  { "quote": "You are my today and all of my tomorrows.", "author": "Leo Christopher" },
  { "quote": "I choose you. And I'll choose you over and over.", "author": "Husein" }
]
```

**Nonogram (`puzzles-nono.json`):**
```json
[
  {
    "size": 8,
    "grid": [[0,0,1,1,1,1,0,0], ...],
    "colors": { "1": "#c44569" },
    "theme": "Heart",
    "quote": "My heart beats only for you.",
    "author": "Husein"
  }
]
```

---

## Implementation Todos

1. **Create daily/index.html** — page shell, day detection, game loader
2. **Build cipher.js** — substitution engine, letter picker UI, solve detection, reveal animation
3. **Build nonogram.js** — grid renderer, clue calculator, solve checker, color reveal animation
4. **Write puzzles-cipher.json** — curate ~200 romantic quotes
5. **Write puzzles-nono.json** — design ~100 pixel art puzzles with colors + quotes
6. **Style it** — shared CSS matching site theme, mobile-responsive
7. **Add streak/localStorage** — completion tracking, streak counter
8. **Add share button** — copy emoji summary to clipboard
9. **Add to landing page** — new card on Game Room index.html
10. **Test on mobile** — iPhone Safari, Android Chrome

---

## Open Questions (for Husein)

- **Personal quotes:** Want to write some personal messages to mix in with famous quotes?
- **Nonogram difficulty:** Prefer all easy (5x5) or a mix of easy/medium?
- **Streak rewards:** Any special message at milestone streaks (7, 30, 100 days)?
- **Tomorrow teaser:** Show a hint of tomorrow's puzzle type, or keep it a surprise?
