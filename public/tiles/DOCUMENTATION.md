# Photo Tiles Game — Developer Documentation

> **Parent doc**: [../../DOCUMENTATION.md](../../DOCUMENTATION.md) (project-wide architecture, deployment, common tasks)

---

## Overview

A pattern-matching tile puzzle (5×5 = 25 tiles, 24 active + 1 decorative center). Match tiles by shared visual attributes to clear them. A surprise photo reveals underneath as tiles are cleared, and on win a romantic jigsaw cascade assembles the full photo from scattered pieces. Originally built as "Fatema Tiles" (source: `C:\Users\huseinm\Downloads\fatema-tiles`).

## Architecture (v2 — April 2026 Redesign)

**What changed from v1:**
| Aspect | v1 (old) | v2 (current) |
|--------|----------|--------------|
| Grid | 6×5 = 30 tiles | 5×5 = 25 tiles (24 active + center heart) |
| Matchable dimensions | 4 (bg, ring, shape, accent) | 3 (ring, shape, accent) |
| Background | Per-tile matchable attribute | Board-level uniform canvas (non-matchable) |
| Pool math | 5 patterns × 3 colors = 15 | 4 variants × 3 colors = 12 |
| Center tile | None | Decorative h❤f monogram with heartbeat animation |
| Tile SVG layers | bg → ring → accent → shape | white base → tint → board bg pattern → ring + shape + accent |

**Why the redesign:**
1. When two tiles matched on background, both tiles turned white — light-colored elements (rings, accents) became invisible on white
2. Having 4 matchable dimensions with 15 items each made boards too hard to complete (too many unique combinations)
3. The old approach had background doing double-duty (matchable attribute AND visual canvas), leading to contrast/visibility conflicts

## Files
- `index.html` — HTML structure, PWA meta tags, links to CSS/JS, theme toast element
- `style.css` — Full styling including 5×5 grid layout, center-tile heartbeat animation, `.theme-pill` toast
- `app.js` — Main application controller (ES modules, imports engine + renderer + photos)
  - Shows theme name + emoji as a toast on each new game (fades after 2s)
  - Skips center tile clicks (`.tile:not(.center-tile)` selector)
  - Animates center heart out on win, plays romantic jigsaw cascade reveal (`playCascadeReveal()`)
- `engine.js` — Board generation, game logic & **theme system** (~450+ lines)
  - Constants: `ROWS=5, COLS=5, TILE_COUNT=25, ACTIVE_TILES=24, CENTER_INDEX=12`
  - `THEMES` array — active themes; `ARCHIVED_THEMES` array — retired themes (check code for current counts)
  - `buildPools(theme)` — generates 3 attribute pools of 12 items each from a theme
  - `generateBoard()` — picks random theme from THEMES, builds pools, creates paired 24-tile board + center heart
  - `GameState` class — manages board, matching, scoring; tracks `currentTheme`
- `renderer.js` — SVG tile rendering (~2500+ lines) — **THE KEY FILE**
  - `renderBg()` — background patterns (board-level, non-matchable)
  - `renderRing()` — ring border styles (3 cases per theme, matchable)
  - `renderShape()` — center shape icons (4 cases per theme, matchable)
  - `renderAccent()` — corner accent decorations (4 cases per theme, matchable)
  - `createTileSVG()` — assembles tile with white base + tint + board bg + matchable layers
  - `createCenterHeartSVG()` — renders the h❤f monogram center tile
- `photos.js` — Daily photo selection from `photos/manifest.json` (one photo per calendar day, sequential, no skips)
- `photos/` — Personal photos revealed as tiles are cleared (62 photos, named `photo-01.jpg` through `photo-62.jpg`)
- `update-photos.ps1` — PowerShell script to regenerate `photos/manifest.json` from image files in `photos/`
- `validate-themes.js` — Pre-commit theme validator (10 checks, all must pass)

## Tile SVG Layer Stack (back-to-front)

Each active tile SVG (`viewBox 0 0 100 100`) contains:

```
Layer 1: <rect fill="white"/>                              ← fully opaque white base (blocks photo)
Layer 2: <rect fill="${boardBg.color}" opacity="0.12"/>    ← very subtle theme tint
Layer 3: <g class="board-bg-layer">${renderBg(boardBg)}</g> ← pattern overlay (SKIPPED for 'solid' themes)
Layer 4: matchable attribute layers (ring, shape, accent)   ← what the player actually matches on
```

When a tile is cleared (matched), the whole tile element goes to `opacity: 0`, revealing the photo CSS `background-image` on the board div underneath — creating a jigsaw reveal effect.

## Win Cascade Reveal

When all 24 tiles are cleared, a romantic **jigsaw cascade animation** plays:

1. Center heart tile animates out (scale down + fade via `.win-reveal`)
2. The CSS background photo is temporarily hidden
3. 25 overlay `<div>` pieces are created, each showing a slice of the photo via `background-position` offsets
4. Pieces start at **random scattered positions** with random rotations (±60°) and small scale (0.3–0.7×)
5. Each piece **flies into its correct grid cell** with staggered delays (~70ms apart) and bouncy easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
6. Cascade order is **fully randomized** each game (Fisher-Yates shuffle)
7. Soft **pink glow pulse** (`rgba(196, 69, 105, 0.3)`) on completion
8. Overlay is removed, CSS background restored, win banner + falling hearts appear

**Timing:** ~2.5s total (25 pieces × 70ms stagger + 900ms settle + 600ms glow)

**Implementation:** `playCascadeReveal(onComplete)` in `app.js` — purely visual, no game state changes. All pieces are absolutely positioned inside a `.cascade-overlay` div appended to `#board`.

## Center Heart Tile (index 12)

The center tile at grid position [2,2] shows an **h❤f** monogram:
- **h** — italic serif, uses theme's first ring color
- **❤** — heart path, uses theme's first accent color, heartbeat CSS animation
- **f** — italic serif, uses theme's second ring color
- The whole tile pulses with a realistic double-pump heartbeat (1.2s cycle)
- On game win, the center tile animates out (scale down + fade)

## Board Background System

Each theme defines a `boardBg` property:
```javascript
boardBg: { pattern: 'waves', color: '#00bcd4' }
```

- **pattern**: name of a case in `renderBg()`, or `'solid'` for no pattern overlay
- **color**: the theme's primary color, used for the 12% tint layer

**boardBg assignments**: Read `engine.js` `THEMES` array for each theme's `boardBg` property. Each has a `pattern` (name of a `renderBg()` case, or `'solid'`) and a `color` (hex).

> Archived themes retain their boardBg definitions in `ARCHIVED_THEMES`. See engine.js for full list.

**Why most themes use 'solid':** Originally all had decorative patterns, but several caused visual confusion — players mistook bg pattern elements for matchable game elements (e.g., Bollywood's spotlight had concentric circles that looked like ring elements). Solid themes get only the white base + 12% color tint.

## Gameplay
1. Start: 24 randomly generated tiles on a 5×5 grid (center = decorative h❤f heart) — theme chosen randomly
2. Theme name + emoji shown briefly as a toast overlay (e.g. "🌙 Celestial")
3. Tap two tiles that share at least one visual attribute (ring, shape, or accent) to match them
4. Matched tiles fade out, revealing a photo underneath (jigsaw reveal)
5. Track combo streaks and clear all 24 tiles to win
6. Romantic jigsaw cascade — photo pieces fly in from random positions and assemble the full photo
7. "✨ New" button starts a fresh board with a new random theme + random photo

### Score Display
- Current combo, best combo, tiles cleared (X/24)

---

## Theme Lifecycle & Creation Guide

Themes rotate regularly — archive stale ones, add fresh ones. Keep **5–8 active themes** for variety without overwhelm. This section is the **complete operational playbook** — it tells Copilot (or any implementer) exactly what to do for each workflow.

### Three Workflows

| # | Workflow | When | Files Modified |
|---|---------|------|---------------|
| 1 | [Brainstorm New Themes](#workflow-1-brainstorm-new-themes) | User asks for theme ideas | None (ideas only) |
| 2 | [Implement New Themes](#workflow-2-implement-new-themes) | User picks themes to build | `engine.js`, `renderer.js` |
| 3 | [Archive / Reactivate Themes](#workflow-3-archive--reactivate-themes) | User wants to rotate themes | `engine.js` only |

### Architecture Quick Reference

```
engine.js (THEMES array)                     renderer.js (SVG rendering)
─────────────────────────────────            ──────────────────────────────────────
Theme {                                      renderBg(attr)     → switch(attr.pattern)
  name, emoji,                                 attr.color = boardBg.color
  palette: {                                   const o = 0.35  (global bg opacity)
    bg:     [3 colors],  ← per-tile tint       → 5 cases per theme
    ring:   [4 colors],  ← matchable
    shape:  [3 colors],  ← matchable         renderRing(attr)   → switch(attr.style)
    accent: [3 colors],  ← matchable           attr.color = one of palette.ring[]
  },                                           → 3 cases per theme
  bgPatterns:   [5],  ← board bg only
  ringStyles:   [3],  ← 4×3=12 pool items   renderShape(attr)  → switch(attr.shape)
  shapeNames:   [4],  ← 4×3=12 pool items     attr.color = one of palette.shape[]
  accentShapes: [4],  ← 4×3=12 pool items     const o = 0.85  (shape opacity)
  boardBg: { pattern, color },                 → 4 cases per theme
}
                                             renderAccent(attr) → switch(attr.accentShape)
Pool math: each dimension needs exactly 12     loops CORNERS=[[16,16],[84,16],[16,84],[84,84]]
items. ring: 4 colors × 3 styles = 12.        attr.color = one of palette.accent[]
shape: 4 names × 3 colors = 12.               uses `out += ...; break;` (NOT return)
accent: 4 shapes × 3 colors = 12.             → 4 cases per theme
bg is NOT in pools (board-level only).
                                             TOTAL: 16 new renderer cases per theme
```

---

### Workflow 1: Brainstorm New Themes

**Trigger**: User says "give me theme ideas", "what new themes should we add", etc.

**Procedure:**

1. **Read current active themes** — open `engine.js`, read the `THEMES` array. Note each theme's name, emoji, and `palette.bg` colors. Present them to the user in this format:
   ```
   Current active themes (N):
   - [Name] [emoji] — [bg color descriptions] ([intensity])
   - ...
   ```

2. **Read archived themes** — scan `ARCHIVED_THEMES` in the same file. Note names to avoid re-proposing (unless explicitly reactivating). Present count to user.

3. **Assess the current palette spread** — categorize each active theme by intensity:
   - **Light**: pastel/soft bg colors (HSL lightness > 60%)
   - **Medium**: mid-tone bg colors (HSL lightness 40-60%)
   - **Bold**: dark or vivid bg colors (HSL lightness < 40% or saturation > 80%)
   
   Identify which intensity bands are over/under-represented. If 4 of 6 themes are light pastels, new themes should be medium or bold.

4. **Identify dominant hue families** — list which hue families are already used across all active themes' bg colors. If blue appears in 3 themes, avoid proposing another blue-dominant theme.

5. **Generate 5–7 theme ideas** with these criteria:
   - **Novelty**: Not similar to any active OR recently archived theme
   - **Rich element vocabulary**: The theme concept must support at least 4 distinct shapes, 4 distinct accents, 3 distinct ring styles, and 5 bg patterns — all visually different from each other
   - **Unique color identity**: Each proposed theme should have a signature color family NOT already dominant in active themes
   - **Variety of intensity**: Propose a mix of light, medium, and bold themes
   - **Implementability**: Shapes/accents should be achievable in simple SVG (paths, circles, rects, polygons). Avoid themes that require complex illustrations.

6. **Present ideas** to the user with:
   - Theme name + emoji
   - 1-line vibe description
   - Proposed signature colors (bg feel)
   - Intensity category (light/medium/bold)
   - Sample element ideas (shapes, accents, ring styles)
   
   Let user pick which to implement.

---

### Workflow 2: Implement New Themes

**Trigger**: User says "let's do [theme names]", "implement these themes", etc.

**This is a 6-step procedure. Do ALL steps for EACH theme.**

#### Step 1: Plan Color Identity (BEFORE any code)

> **The #1 lesson learned**: Themes that individually look fine can feel identical when played together. Every theme needs a **unique color fingerprint** — a set of bg colors that no other active theme shares.

**Exact procedure:**

1. Open `engine.js` and extract ALL `palette.bg` arrays from every active theme in `THEMES`.

2. For each active theme, classify:
   - **Hue family**: What color family do the 3 bg colors belong to? (e.g., "blue/green/orange", "pink/blue/mint")
   - **Intensity**: Light / Medium / Bold
   
3. For the new theme, choose 3 bg colors that:
   - ✅ Use a hue family NOT already dominant in active themes
   - ✅ Fill an intensity gap (if most themes are light, make this one bold)
   - ✅ Span ≥ 40° of HSL hue across the 3 colors (validator enforces this)
   - ✅ Are visually distinct from each other (not 3 shades of the same blue)
   - ❌ Do NOT reuse the same "blue + green + warm" triad that many themes default to

4. For element colors (ring/shape/accent), choose colors with:
   - ✅ HSL lightness ≤ 50% (Material Design 600–900 range) — these render on near-white tiles
   - ✅ No color that matches any bg color in the same theme (element would disappear on that bg tile)
   - ✅ All colors within each group visually distinct (no duplicates, no near-duplicates)
   - ❌ NEVER use: white (`#ffffff`), near-white (`#eeeeee`), light gray (`#cccccc`), bright yellow (`#ffeb3b`, `#ffff00`, `#ffd740`), or any pastel as an element color

5. **Present the planned palette to the user** before coding:
   ```
   [ThemeName] planned palette:
   BG: #hex1 (description), #hex2 (description), #hex3 (description)
   Identity: [intensity] — [signature description]
   Compared to active themes: [why this is different]
   ```

#### Step 2: Define Theme Object (engine.js)

**Exact procedure:**

1. Open `engine.js`, find the `THEMES` array (starts at line 13 with `const THEMES = [`).

2. Find the closing `];` of the THEMES array (look for `];` followed by a blank line and `const ARCHIVED_THEMES`).

3. **Add the new theme object BEFORE the closing `];`**, after the last existing theme. Follow this exact template:

```javascript
  {
    name: 'ThemeName', emoji: '🎯',
    palette: {
      bg:     ['#hex1', '#hex2', '#hex3'],
      ring:   ['#hex1', '#hex2', '#hex3', '#hex4'],
      shape:  ['#hex1', '#hex2', '#hex3'],
      accent: ['#hex1', '#hex2', '#hex3'],
    },
    bgPatterns:   ['themename-pat1', 'themename-pat2', 'themename-pat3', 'themename-pat4', 'themename-pat5'],
    ringStyles:   ['themename-ring1', 'themename-ring2', 'themename-ring3'],
    shapeNames:   ['themename-shape1', 'themename-shape2', 'themename-shape3', 'themename-shape4'],
    accentShapes: ['themename-acc1', 'themename-acc2', 'themename-acc3', 'themename-acc4'],
    boardBg:      { pattern: 'solid', color: '#hex' },
  },
```

4. **Verify counts** (the validator catches these but catch them early):
   - `palette.bg` — exactly 3
   - `palette.ring` — exactly 4
   - `palette.shape` — exactly 3
   - `palette.accent` — exactly 3
   - `bgPatterns` — exactly 5
   - `ringStyles` — exactly 3
   - `shapeNames` — exactly 4
   - `accentShapes` — exactly 4

5. **Verify name uniqueness** — search renderer.js for each pattern/style/shape/accent name. If ANY name already exists as a `case` label, rename it (prefix with theme name, e.g., `'circus-star'` not `'star'`).

6. **boardBg rules:**
   - `pattern` must be either `'solid'` or one of the names in `bgPatterns`
   - `color` should be the theme's dominant/primary color
   - When in doubt, use `'solid'` — it's the safest choice (no visual confusion)

#### Step 3: Add Renderer Cases (renderer.js)

**Add exactly 16 case blocks** across 4 switch statements. The renderer file is ~2500 lines. Here are the exact locations and function signatures:

##### 3a: Background patterns — `renderBg()` (5 cases)

**Function location**: Starts at line ~16. Ends with `default: return '';` at line ~927.

**Function signature and available variables:**
```javascript
function renderBg(attr) {
  const c = attr.color;    // boardBg.color from engine.js
  const o = 0.35;          // global bg opacity — use this, don't hardcode
  switch (attr.pattern) {
    // ... existing cases ...
    
    // ── YourTheme ──           ← ADD COMMENT HEADER
    case 'your-pattern-name': {  ← ADD YOUR CASES BEFORE default:
      // Build SVG string, return it
    }
    
    default: return '';          ← DO NOT DELETE THIS LINE OR THE } BELOW IT
  }
}                                ← DO NOT DELETE THIS CLOSING BRACE
```

**Rules for bg patterns:**
- ✅ Start each pattern with a base tint rect: `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`
- ✅ Add decorative elements on top (lines, dashes, texture marks)
- ❌ NEVER use circles, rings, or geometric shapes — they'll be confused with game elements
- ❌ NEVER use elements positioned in corners — they'll be confused with accents
- For randomness: `const rng = mulberry32(c.charCodeAt(1));` then `rng()` returns 0-1

**Template — bg pattern with subtle texture:**
```javascript
    // ── MyTheme ──
    case 'my-texture': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      // Add decorative texture on top
      for (let i = 0; i < 5; i++) {
        s += `<line x1="${10+i*20}" y1="4" x2="${10+i*20}" y2="96" stroke="${c}" stroke-width="0.5" opacity="${o*0.3}"/>`;
      }
      return s;
    }
```

##### 3b: Ring styles — `renderRing()` (3 cases)

**Function location**: Starts at line ~931. Ends with `default: return '';` at line ~1304.

**Function signature and available variables:**
```javascript
function renderRing(attr) {
  const c = attr.color;    // one of palette.ring[] colors
  switch (attr.style) {
    // ... existing cases ...
    // ADD YOUR CASES BEFORE default:
    default: return '';
  }
}
```

**Rules**: `stroke-width ≥ 2.5`, `opacity ≥ 0.6`. Rings are borders/frames around the tile edge.

**Template — simple rect border:**
```javascript
    // ── MyTheme ──
    case 'my-border': {
      const c = attr.color;
      return `<rect x="4" y="4" width="92" height="92" rx="8"
        fill="none" stroke="${c}" stroke-width="4" opacity="0.8"/>`;
    }
```

**Template — double border:**
```javascript
    case 'my-double': {
      const c = attr.color;
      return `<rect x="3" y="3" width="94" height="94" rx="7" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>` +
             `<rect x="9" y="9" width="82" height="82" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>`;
    }
```

**Template — dashed border:**
```javascript
    case 'my-dashed': {
      const c = attr.color;
      return `<rect x="4" y="4" width="92" height="92" rx="6"
        fill="none" stroke="${c}" stroke-width="3.5" stroke-dasharray="8 4" opacity="0.7"/>`;
    }
```

##### 3c: Center shapes — `renderShape()` (4 cases)

**Function location**: Starts at line ~1310. Ends with `default: return '';` at line ~1940.

**Function signature and available variables:**
```javascript
function renderShape(attr) {
  const c = attr.color;    // one of palette.shape[] colors
  const o = 0.85;          // shape opacity convention — always use this
  switch (attr.shape) {
    // ... existing cases ...
    // ADD YOUR CASES BEFORE default:
    default: return '';
  }
}
```

**Rules**: Shapes render in the CENTER of the tile (~50,50). Keep within roughly x:25-75, y:25-75 to avoid overlap with ring borders and corner accents.

**Template — simple filled shape:**
```javascript
    // ── MyTheme ──
    case 'my-circle': {
      const c = attr.color;
      const o = 0.85;
      return `<circle cx="50" cy="50" r="16" fill="${c}" opacity="${o}"/>`;
    }
```

**Template — compound shape (multiple SVG elements):**
```javascript
    case 'my-star': {
      const c = attr.color;
      const o = 0.85;
      return `<polygon points="50,30 55,45 70,45 58,55 62,70 50,60 38,70 42,55 30,45 45,45"
        fill="${c}" opacity="${o}"/>`;
    }
```

**Template — path-based shape:**
```javascript
    case 'my-custom': {
      const c = attr.color;
      const o = 0.85;
      return `<path d="M50 32 C60 32 68 40 68 50 C68 60 60 68 50 68 C40 68 32 60 32 50 C32 40 40 32 50 32Z"
        fill="${c}" opacity="${o}"/>`;
    }
```

##### 3d: Corner accents — `renderAccent()` (4 cases)

**Function location**: Starts at line ~1946 (after `const CORNERS = [[16, 16], [84, 16], [16, 84], [84, 84]];`). Ends with `default: return '';` at line ~2422 (inside `renderAttributeInner`).

**⚠️ renderAccent is DIFFERENT from the other functions** — it loops over 4 corners and uses `break` + `out +=`, NOT `return`:

```javascript
const CORNERS = [[16, 16], [84, 16], [16, 84], [84, 84]];

function renderAccent(attr) {
  const c = attr.color;    // one of palette.accent[] colors
  let out = '';
  for (const [cx, cy] of CORNERS) {
    switch (attr.accentShape) {
      // ... existing cases ...
      // ADD YOUR CASES BEFORE default:
      default: break;       // note: `break` not `return ''`
    }
  }
  return out;
}
```

**CRITICAL**: Each case MUST use `out += ...; break;` — NOT `return`. The loop runs 4 times (once per corner). `cx` and `cy` are the corner coordinates.

**Rules**: `opacity ≥ 0.6`, circle `r ≥ 2.5`, `stroke-width ≥ 1.5`.

**Template — filled dots:**
```javascript
      // ── MyTheme ──
      case 'my-dots':
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}" opacity="0.7"/>`; break;
```

**Template — small diamonds:**
```javascript
      case 'my-diamonds':
        out += `<polygon points="${cx},${cy-5} ${cx+5},${cy} ${cx},${cy+5} ${cx-5},${cy}"
          fill="${c}" opacity="0.7"/>`; break;
```

**Template — corner squares:**
```javascript
      case 'my-squares':
        out += `<rect x="${cx-4}" y="${cy-4}" width="8" height="8" rx="1.5"
          fill="${c}" opacity="0.7"/>`; break;
```

**Template — stroked circles (outline only):**
```javascript
      case 'my-rings':
        out += `<circle cx="${cx}" cy="${cy}" r="5" fill="none"
          stroke="${c}" stroke-width="2" opacity="0.7"/>`; break;
```

#### Step 4: Validate

```bash
node validate-themes.js
```

**All 10 checks must be green ✅ before committing.** If any fail:

| Check | What It Catches | How to Fix |
|-------|----------------|-----------|
| Syntax | Missing braces, unclosed strings | Look at the line number in error. Usually a deleted `}` or missing backtick. |
| Pool math | Wrong counts (needs 4×3=12 per dimension) | Count your arrays: bg=3, ring=4, shape=3, accent=3, bgPatterns=5, ringStyles=3, shapeNames=4, accentShapes=4 |
| Name uniqueness | Duplicate case labels across themes | Rename the duplicate — prefix with theme name |
| Engine→Renderer coverage | Pattern defined in engine.js but no case in renderer.js | Add the missing case block in the right function |
| Duplicate cases | Same label twice in one function | Search for the label, remove the duplicate |
| Function dependencies | Calling undefined functions | If using `mulberry32`, it's at the top of renderer.js — already defined |
| Color distinctness | Identical hex in same palette group | Change one of the duplicate hex values |
| Bg hue diversity | All 3 bg colors same hue (needs 40°+ spread) | Replace one bg color with a different hue family. Warm tones (~15°) are close to each other — pair with a cool tone (180°+). |
| boardBg validation | Missing boardBg property | Add `boardBg: { pattern: 'solid', color: '#hex' }` |
| Orphan cases | Cases in renderer with no theme using them | Warning only — OK for archived themes. Ignore. |

#### Step 5: Manual Verification (IMPORTANT — validator misses these)

The validator catches structural errors but NOT visual problems. Check these manually:

1. **Element color lightness** — Eyeball every ring/shape/accent hex. If it looks light/pastel, it WILL be invisible on the near-white tile. Use a color picker to verify HSL lightness ≤ 50%.

2. **Bg-vs-element collision** — For each of the 3 bg colors, mentally overlay each element color. Any element color that's the same hue AND similar lightness to a bg color will disappear on tiles with that bg tint. Example: dark red accent (`#c62828`) on red bg tint → invisible.

3. **Cross-theme similarity** — Compare your new theme's bg colors to ALL other active themes. If two themes have the same color feel (both blue/green/warm, both all-pastels), one needs to change. This was our #1 iteration issue.

4. **Accent-on-bg contrast** — Any accent can land on any bg (random assignment). If accent hue ≈ bg hue, that accent vanishes on that tile. Ensure no accent shares a hue with any bg in the same theme.

#### Step 6: Commit & Deploy

```bash
git add public/tiles/engine.js public/tiles/renderer.js
git commit -m "Add [ThemeName] theme to Photo Tiles

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push
```

Auto-deploys to Render.com (~2 min). Hard-refresh (Ctrl+Shift+R) to bypass cache.

**If implementing multiple themes at once**: Add all theme objects to engine.js and all renderer cases to renderer.js, then run the validator once and commit once. Don't do one theme at a time.

---

### Workflow 3: Archive / Reactivate Themes

**Trigger**: User says "archive [theme names]", "move X to archive", "reactivate Y", etc.

#### Archiving (Active → Archived)

**Exact procedure:**

1. Open `engine.js`.

2. Find the `THEMES` array (starts at `const THEMES = [`, line 13).

3. Find the `ARCHIVED_THEMES` array (starts at `const ARCHIVED_THEMES = [`, below THEMES).

4. For each theme to archive:
   - **Cut** the entire theme object (from `{` to `},`) out of the `THEMES` array
   - **Paste** it at the TOP of the `ARCHIVED_THEMES` array (just after the opening `[`)
   - Add a comment if desired: `// Archived [date]`

5. **DO NOT** touch renderer.js — leave all case blocks in place. They become dead code (harmless). The validator will warn about "orphan cases" — this is expected and OK.

6. **DO NOT** touch DOCUMENTATION.md Appendix A — archived theme entries stay for historical reference.

7. Run `node validate-themes.js` — must pass (ignore orphan case warnings).

8. Verify the THEMES array still has at least 5 themes for good variety.

9. Commit:
   ```bash
   git add public/tiles/engine.js
   git commit -m "Archive [ThemeName1], [ThemeName2] themes
   
   Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
   git push
   ```

#### Reactivating (Archived → Active)

**Exact procedure:**

1. Open `engine.js`.

2. **Cut** the theme object from `ARCHIVED_THEMES`.

3. **Paste** it into the `THEMES` array (at the end, before the closing `];`).

4. **IMPORTANT**: Check palette colors against currently active themes (same as Workflow 2, Step 1). The reactivated theme may have been archived precisely because its colors were too similar to others. If the current active set has changed, the old palette may now be fine — or may still clash.

5. Run `node validate-themes.js` — must pass.

6. Commit and push.

---

### Common Pitfalls (Quick Reference)

| # | Pitfall | How to Avoid |
|---|---------|-------------|
| 1 | **All themes look the same** | Plan color identity BEFORE coding (Step 0). Map against active themes. |
| 2 | **Light element colors invisible** | Ring/shape/accent lightness ≤ 50%. No whites, pastels, bright yellows. |
| 3 | **Element disappears on matching bg** | Check every element color against every bg color in the same theme. |
| 4 | **Bg pattern confused with game elements** | No circles/rings/geometry in bg patterns. Use `'solid'` when in doubt. |
| 5 | **Thin/faint elements** | Enforce minimums: ring stroke ≥ 2.5, accent r ≥ 2.5, opacity ≥ 0.6 |
| 6 | **Duplicate case name** | Prefix with theme: `'circus-star'` not `'star'`. Search renderer first. |
| 7 | **Deleted closing brace** | Add cases BEFORE `default:`. Validator catches syntax errors. |
| 8 | **All-same-hue bg** | 3 bg colors need ≥ 40° hue spread. Validator catches this. |
| 9 | **Identical palette colors** | `ring: ['#333', '#333', '#333', '#333']` makes game unsolvable. Validator catches this. |
| 10 | **Wrong pattern count** | Must be exactly 5 bgPatterns, 3 ringStyles, 4 shapeNames, 4 accentShapes. Validator catches this. |
| 11 | **Case with no return** | `case 'x': { /* forgot return */ }` — silent blank tile. Manual check. |
| 12 | **Bright yellow as element** | `#ffeb3b` or `#ffff00` — the single worst offender. Substitute deep orange `#e65100` or amber `#ff8f00`. |

### Element Size & Opacity Minimums

These thresholds were established after a sweep found **197 sub-threshold elements** across all themes. The validator does NOT check these — manual discipline required.

| Element Type | Attribute | Minimum | Why |
|-------------|-----------|---------|-----|
| Ring | `stroke-width` | 2.5 | Thinner strokes disappear at game zoom levels |
| Ring | `opacity` | 0.6 | Lower opacity blends into background |
| Accent | `opacity` | 0.6 | Must be clearly visible in corners |
| Accent | `r` (circle radius) | 2.5 | Smaller circles become invisible dots |
| Accent | `stroke-width` | 1.5 | Stroked-only accents need visible lines |
| Shape | `opacity` | 0.85 (convention) | Center shapes must dominate the tile |

**Reference "good" elements** (copy these patterns when starting):
- Ring: Azulejo `solid` — `stroke-width="5"`, full opacity
- Accent: Azulejo `circles` — `r="7"`, full opacity, solid fill
- Shape: Most shapes use `const o = 0.85` — strong and clear

### Colors That Failed in Production

These specific colors were shipped (or nearly shipped) and had to be hotfixed. Keep this list as a reference when choosing palette colors.

| Color | Hex | Theme | What Happened |
|-------|-----|-------|---------------|
| White | `#ffffff` | Noir, Arithmetic, Street Food | Completely invisible ring/shape/accent |
| Near-white | `#eeeeee` | Noir | Invisible accent |
| Light gray | `#cccccc` | Noir | Barely visible ring |
| Bright yellow | `#ffeb3b` | Arithmetic, Street Food, Tropical | Nearly invisible on white |
| Pure yellow | `#ffff00` | Neon | Invisible accent |
| Light blue | `#b3e5fc` | Arctic | Invisible accent |
| Light teal | `#80deea` | Arctic | Invisible accent |
| Light blue-gray | `#b0bec5`, `#90a4ae` | Celestial | Faint ring/accent |
| Yellow-amber | `#ffd740` | Celestial | Weak accent |
| Light tan | `#d4a574`, `#c49a6c` | Sepia | Blends with parchment tint |

**What replaced them**: Every case above was fixed by substituting a darker variant from the same hue family (e.g., Arctic `#b3e5fc` → `#0d47a1`, Noir `#ffffff` → `#222222`).

### Opacity & Layer Stack Reference

```
Board div:
  └── CSS background-image: url(photo.jpg)     ← revealed when tiles cleared
  └── Tile elements (25 total):
      ├── Active tile SVG (24 tiles):
      │   ├── Layer 1: <rect fill="white"/>                     opacity=1.0 (blocks photo)
      │   ├── Layer 2: <rect fill="${boardBg.color}"/>          opacity=0.12 (subtle tint)
      │   ├── Layer 3: board-bg-layer (if pattern != 'solid')   opacity=0.35 (global) × per-pattern hardcoded
      │   ├── Layer 4: ring SVG                                 opacity ≥ 0.6
      │   ├── Layer 5: shape SVG                                opacity = 0.85
      │   └── Layer 6: accent SVG (×4 corners)                  opacity ≥ 0.6
      └── Center tile SVG (index 12):
          ├── Layers 1-3: same as active tile
          ├── "h" text (italic serif, ring color 1)
          ├── ❤ heart path (accent color 1, scale 0.22)
          └── "f" text (italic serif, ring color 2)

CSS animations:
  .center-tile: heartPulse 1.2s infinite (double-pump: scale 1→1.12→1→1.08→1)
  .center-tile.win-reveal: opacity 0, scale 0.3 (animate out on win)
  .cascade-overlay: 25 absolutely-positioned photo slices fly in from random positions
    - Each piece: transition 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) with staggered delays
    - Completion glow: inset box-shadow rgba(196, 69, 105, 0.3)
```

### Pattern Opacity Hardcodes

Some board bg patterns have hardcoded opacity values (overriding the global 0.35). If adding a patterned bg, follow these guidelines:

| Pattern Weight | Hardcoded Opacity | Examples |
|---------------|-------------------|---------|
| Heavy (fills most of tile) | 0.3 | checkered-tablecloth, ice-crystals |
| Medium (lines/grid) | 0.3-0.35 | chalkboard, sky-gradient |
| Light (sparse elements) | 0.35 (global default) | waves, gingham |
| None | skipped entirely | solid (7 themes) |

---

## Key Bug Fixes History

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Tiles blank after Neon/Tropical theme add | Sub-agent placed `default: return '';` but deleted the closing `}` of the switch + function in `renderBg` and `renderRing` — brace count coincidentally balanced | Re-added missing closing braces; added structural validation to catch this |
| Indian/Bollywood/Arithmetic themes blank tiles | `mulberry32()` PRNG called by 5 patterns (paisley, sequins, disco-floor, chalkboard, sequin-border) but never defined in renderer.js — `ReferenceError` crashed tile rendering | Added `mulberry32` function definition at top of renderer.js |
| Bollywood star shape never renders | Duplicate `case 'star'` in renderShape — Azulejo's 8-pointed star (earlier in file) always matched first, Bollywood's was unreachable | Renamed Bollywood's to `case 'filmi-star'` in both engine.js and renderer.js |
| Noir/Sepia game unsolvable | Palette had identical repeated colors (e.g. 3x `#212121`) — tiles visually identical but different IDs | Changed to distinct shades within same hue family |
| **7 themes washed-out / invisible bg** | Light/pastel bg palette colors (lightness 75-95%) rendered at `o=0.6` opacity over the white tile base (`rgba(255,255,255,0.88)` in style.css). Many bg patterns further reduced opacity with multipliers like `o*0.3`. Combined effect: bg colors nearly invisible. Arithmetic & Sky were unaffected because they hardcode solid rect fills at 0.82-0.88 opacity instead of using the shared `o` variable. | Two-pronged fix: (1) Bumped renderer base bg opacity from `0.6` to `0.75` (renderer.js line 18). (2) Darkened bg palette colors for Azulejo, Garden, Deco, Mosaic, Candy, Sepia, Tropical — shifting lightest hex values down 1-2 steps on the Material Design scale. All proposed colors cross-checked against shape/ring/accent palettes to avoid same-color collisions that would break tile solvability. |
| **Celestial tiles appear all-white** | `createTileSVG()` starts every tile with `fill="white" opacity="0.1"` base rect. Celestial bg patterns (starfield, nebula, aurora, cosmic-dust, void) only drew tiny decorative elements (2px stars, faint ellipses at 0.25-0.4 opacity) with NO base area fill — the white base showed through. Newer themes (Arithmetic, Sky) correctly start each bg pattern with a solid `<rect>` fill. | Added `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25-0.3}"/>` as the first SVG element in all 5 Celestial bg patterns to provide a visible color base tint. |
| **36 sparse bg patterns across 10 themes** | Same root cause as Celestial: older bg patterns only drew decorative line work (dots, thin strokes, arcs) without a base area fill. Affected: Garden (5), Deco (5), Neon (5), Indian (5), Tropical (4), Mosaic (2), Candy (2), Noir (3), Sepia (3), Bollywood (2). Patterns with existing area coverage (e.g. checkerboard, gingham, sunset-gradient, disco-floor) were unaffected. | Added base tint `<rect>` as first SVG element in each sparse pattern. Opacity multiplier chosen per-theme: `o*0.25` for patterns with moderate decorative coverage, `o*0.3` for very sparse patterns (scattered dots, thin lines). |
| **Bg palette hue diversity** | Arctic theme used 3 shades of blue as bg colors — tiles looked monochrome despite technically distinct hex values. Arithmetic had 3 shades of green. | Diversified bg palettes (Arctic: blue+ice-white+lavender; Arithmetic: green+cream+brown). Added validator CHECK 9: bg hue diversity requires 40° minimum hue spread across the 3 bg colors (Noir/Sepia/Neon exempt as intentionally narrow palettes). |

### v2 Redesign-Era Fixes (April 2026)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| **Photo bleed-through on tiles** | Old architecture: tile bg was semi-transparent, letting the underlying photo show through on uncleared tiles | v2: Added opaque `<rect fill="white"/>` as Layer 1 in `createTileSVG()`. Photo is blocked until tile is cleared (opacity → 0). |
| **Dark backgrounds on tiles** | Some themes' boardBg produced very dark tile backgrounds where ring/accent elements were invisible | v2: Changed boardBg tint to only 12% opacity (`opacity="0.12"`). Tiles are always near-white. Combined with `'solid'` pattern for 7 themes. |
| **Edge tile border clipping** | Ring borders (stroke-width 3-5) on edge tiles were clipped by the grid container's overflow hidden | Added `overflow: visible` and `padding: 4px` to `#board` container in style.css |
| **Bollywood spotlight ≈ ring confusion** | Bollywood's `spotlight` bg pattern used concentric circles — players thought circles were ring game elements | Changed Bollywood boardBg from `spotlight` to `'solid'`. Applied same fix to 6 other themes with confusing patterns. |
| **Board bg pattern too strong** | Pattern overlay at 0.75 opacity competed with matchable elements for attention | Reduced global bg pattern opacity from 0.75 → 0.35. Heavy patterns hardcoded to 0.3. |
| **197 low-visibility elements** | Across all 16 themes: 60 ring opacities < 0.6, 49 ring strokes < 2.5, 39 accent opacities < 0.6, 34 accent radii < 2.5, 15 accent strokes < 1.5 | Wrote Python audit script to scan renderer.js for sub-threshold values. Automated regex fix clamped all 197 to minimums. Validator 10/10 post-fix. |
| **Tropical yellow accent invisible** | `#ffeb3b` (bright yellow) nearly invisible on near-white tile background | Changed Tropical accent `#ffeb3b` → `#e65100` (deep orange) |
| **Arctic accents invisible** | `['#b3e5fc', '#ffffff', '#80deea']` — all pastel/white on light blue tile | Changed to `['#0d47a1', '#4a148c', '#00695c']` — all dark colors |
| **7 themes with invisible palette colors** | Ring/shape/accent palettes used whites, light grays, bright yellows, pastels — all invisible on near-white tile backgrounds | Batch fix: Arctic, Noir, Neon, Arithmetic, Street Food, Celestial, Sepia — substituted every light color with a dark variant from same hue. See the "Colors That Failed" table above. |
| **Street Food elements too thin** | Ring strokes and accent sizes below visibility thresholds — elements present but essentially invisible | Boosted ring stroke widths and accent sizes specifically for Street Food; then caught the same issue globally (the "197 fixes" above) |
| **Center heart off-center** | Heart SVG Y position was calculated from top of viewBox, not visual center | Adjusted Y translate position in `createCenterHeartSVG()` for visual centering |
| **h❤f letter spacing uneven** | "h" at x=22, heart at x=50, "f" at x=78 — gap before heart was larger than gap after | Adjusted: h at x=20, heart at x=52, f at x=80 — optically balanced |
| **Indistinguishable tile backgrounds** | `boardBg.color` tint was uniform (same color at 12% opacity for ALL tiles). All tiles looked identically near-white regardless of theme | Per-tile bg tint: `generateBoard()` assigns a random `bgColor` from `theme.palette.bg` to each tile. `createTileSVG()` renders it at 22% opacity. Tiles now have distinct colored tints. |

### Feature Additions (April 2026)

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Romantic jigsaw cascade reveal** | On win, instead of just showing the photo, 25 pieces fly in from random scattered positions and assemble the full photo like a jigsaw puzzle snapping together | `playCascadeReveal(onComplete)` in `app.js`. Creates 25 overlay divs with `background-position` slices. Fisher-Yates shuffle for random order, staggered 70ms delays, bouncy `cubic-bezier(0.34, 1.56, 0.64, 1)` easing, pink glow pulse on completion. ~2.5s total. |

---

## Photo Reveal System

### Daily Photo Rotation
Each calendar day shows **one** photo as the jigsaw reveal. Photos advance sequentially — never randomly — so there's something new to look forward to each day.

**Key behavior:**
- First play ever → `photo-01.jpg`
- Next calendar day someone plays → advances to `photo-02.jpg`
- If nobody plays for 2 days, the next photo is still `photo-02.jpg` (no skipping)
- Same day, multiple plays → same photo all day
- After the last photo, cycles back to `photo-01.jpg`

**How it works:** `photos.js` stores two keys in `localStorage`:
| Key | Value | Purpose |
|-----|-------|---------|
| `tiles_photo_date` | `"YYYY-MM-DD"` | Last calendar day someone played |
| `tiles_photo_index` | `"0"`, `"1"`, ... | Current position in the manifest array |

On each game start, `getDailyPhotoURL()` checks if today's date differs from the stored date. If yes, it increments the index (wrapping via modulo). If same day, it returns the same photo.

### Managing Photos

**Adding new photos (do this before the cycle completes!):**
1. Drop image files (`.jpg`, `.png`, `.webp`, `.gif`) into `public/tiles/photos/`
2. Rename them to continue the sequence: `photo-63.jpg`, `photo-64.jpg`, etc.
3. Run from the `public/tiles/` directory:
   ```powershell
   .\update-photos.ps1
   ```
4. Commit and push

**`update-photos.ps1`** scans the `photos/` folder for image files, sorts by name, and writes `manifest.json` as a JSON array of filenames. The sequential naming (`photo-01.jpg`, `photo-02.jpg`, ...) ensures the order in the manifest matches the intended reveal order.

**Current inventory:** 62 photos → approximately 2 months of daily reveals.

### Usage Tracking & Stats

Every photo shown is logged in `localStorage` under `tiles_photo_log` with the filename and every date it was displayed:
```json
{
  "photo-01.jpg": ["2026-04-24"],
  "photo-02.jpg": ["2026-04-25", "2026-06-26"],
  "photo-35.jpg": []
}
```

**To check which photos have been used/unused and how many times:**
1. Open the tiles game in your browser
2. Open the browser console (F12 → Console tab)
3. Run:
   ```js
   await photoStats()
   ```
4. You'll see a table like:
   | photo | times | dates |
   |-------|-------|-------|
   | photo-01.jpg | 2 | 2026-04-24, 2026-06-25 |
   | photo-02.jpg | 1 | 2026-04-25 |
   
   Plus a list of unused photos.

**When to add more photos:** When `unused` count is getting low (say < 10), drop new images into `photos/`, rename them to continue the sequence (`photo-63.jpg`, `photo-64.jpg`, ...), run `.\update-photos.ps1`, and push.

**localStorage keys reference:**
| Key | Purpose |
|-----|---------|
| `tiles_photo_date` | Last calendar day someone played (`"YYYY-MM-DD"`) |
| `tiles_photo_index` | Current position in the manifest array |
| `tiles_photo_log` | Full usage history — `{ filename: [dates] }` |

---

## Future Ideas

### Vision
The game has a rotating set of active themes on a streamlined 5×5 / 3-dimension architecture. Background is board-level, visibility minimums are enforced, and the h❤f center tile adds personality. Future expansion should explore two directions: (1) **Pattern Mode** — a fundamentally different engine mode for monochrome themes, and (2) **UX enhancements** that improve the gameplay experience.

### Pattern Mode (Monochrome Themes)

The current engine uses **Color Mode**: `4 variants × 3 colors = 12` per dimension. This works great for colorful themes but limits monochrome designs (repeating the same color makes tiles visually identical but with different IDs, breaking solvability).

A new **Pattern Mode** would use: `12 unique patterns × 1 color = 12` per dimension. All differentiation comes from shapes, line work, and geometric complexity — not color.

`buildPools()` would need a `monochrome: true` flag (or similar) to switch between the two generation strategies.

**Inspiration:**
| Style | Description | Color Palette |
|-------|------------|---------------|
| **Moorish/Moroccan** | Compass stars, diamond frames, geometric interlocking | Black + gold on white |
| **Portuguese Azulejo (v2)** | Intricate line art tiles, floral & geometric | Blue on white |
| **Noir (v2)** | Intricate line art, stipple, crosshatch | White on black |
| **Sepia (v2)** | Vintage engraving style, ornate frames | Brown on parchment |

**Implementation effort per pattern-mode theme:**
- 12 unique ring styles (border treatments)
- 12 unique center shapes (geometric motifs)
- 12 unique corner accents (decorative details)
- 5 background patterns (board-level only)
- Total: ~41 new SVG rendering cases per theme

### UX Enhancements

| Idea | Description | Complexity |
|------|-------------|------------|
| **Theme selector** | Let players choose a specific theme instead of random | Low — add dropdown to UI, pass to `generateBoard()` |
| **Difficulty modes** | Easy (2 dims to match) vs Normal (3 dims) vs Hard (timer) | Medium — parameterize `buildPools()` |
| **Photo upload** | Let users upload their own photos for the jigsaw reveal | Medium — replace `photos.js` with upload handler |
| **Undo last move** | Let players undo their last tile selection | Low — track last selection in GameState |
| **Sound effects** | Match sound, combo sound, win jingle | Low — HTML5 Audio |
| **Structural redesigns** | Change what the 3 dimensions ARE (nested squares, concentric circles, quadrant tiles) | High — new renderer architecture |

---

## Appendix A: Theme Palette Reference (Historical)

> **DO NOT maintain active theme listings here.** Active themes change frequently via rotation. Always read `engine.js` `THEMES` array for the current active set. This appendix is a **historical record** of palette decisions and bug fixes for the original 16 v2 themes.

Each theme defines: palette (bg 3 / ring 4 / shape 3 / accent 3), 5 bg patterns, 3 ring styles, **4** center shapes, **4** corner accents, and a `boardBg` assignment.

> **v2 changes from v1**: Ring palette reduced 5→4 colors. shapeNames reduced 5→4. accentShapes reduced 5→4. Added `boardBg` per theme. Several themes had palette colors replaced for visibility (see Bug Fixes History).

### Original 16 Themes (v2 Launch)

These were the original themes at v2 launch. Many are now archived; some may have been reactivated. Check `engine.js` for current status.

#### Azulejo 🎨 (original)
- **Vibe**: Portuguese ceramic tiles
- **boardBg**: checkerboard / `#66BB6A`
- **Palette**: bg `#66BB6A, #F06292, #FFB300` / ring `#2E7D32, #C2185B, #1565C0, #6A1B9A` / shape `#43A047, #E91E63, #1E88E5` / accent `#FF6D00, #00ACC1, #AB47BC`
- **Ring styles**: solid, dashed, double
- **Shapes**: cross, flower, star, diamond
- **Accents**: circles, diamonds, squares, triangles

#### Celestial 🌙
- **Vibe**: Night sky, cosmic
- **boardBg**: solid / `#1a237e`
- **Palette**: bg `#1a237e, #4a148c, #ff8f00` / ring `#455a64, #ffab00, #00838f, #e040fb` / shape `#00838f, #e040fb, #ffab00` / accent `#5c6bc0, #00838f, #e65100`
- **v2 fixes**: Ring `#90a4ae` → `#455a64`, accent `#b0bec5` → `#5c6bc0`, `#ffd740` → `#e65100`
- **Ring styles**: glow, dotted, eclipse
- **Shapes**: crescent, starburst, hexagon, saturn
- **Accents**: tiny-stars, sparks, orbs, carets

#### Garden 🌿
- **Vibe**: Botanical, floral
- **boardBg**: solid / `#4caf50`
- **Palette**: bg `#4caf50, #ba68c8, #fbc02d` / ring `#2e7d32, #7b1fa2, #ef6c00, #00838f` / shape `#43a047, #ab47bc, #ff7043` / accent `#ff6f00, #00897b, #d81b60`
- **Ring styles**: vine, thorn, ribbon
- **Shapes**: heart, tulip, leaf, raindrop
- **Accents**: seeds, dewdrops, buds, rosettes

#### Deco ✨
- **Vibe**: Art Deco geometric
- **boardBg**: solid / `#ffb300`
- **Palette**: bg `#ffb300, #4db6ac, #e57373` / ring `#bf360c, #1b5e20, #4a148c, #01579b` / shape `#d84315, #1b5e20, #283593` / accent `#ff6f00, #2e7d32, #6a1b9a`
- **Ring styles**: thick-thin, dotted-line, fillet
- **Shapes**: arch, bowtie, pentagon, keystone
- **Accents**: rays, studs, arrows, wings

#### Mosaic 🏺
- **Vibe**: Terracotta tessellation
- **boardBg**: solid / `#8d6e63`
- **Palette**: bg `#8d6e63, #4db6ac, #ffb74d` / ring `#d84315, #00695c, #f9a825, #283593` / shape `#bf360c, #00897b, #f57f17` / accent `#e65100, #00838f, #827717`
- **Ring styles**: rope, notched, inset
- **Shapes**: octagon, arrow-shape, hourglass, shield
- **Accents**: plus-signs, arrowheads, wedges, pips

#### Candy 🍬
- **Vibe**: Sweet shop, playful
- **boardBg**: gingham / `#f06292`
- **Palette**: bg `#f06292, #81c784, #ffcc80` / ring `#c2185b, #00897b, #ff6f00, #6a1b9a` / shape `#e91e63, #00bfa5, #ff9100` / accent `#d81b60, #00acc1, #ff6d00`
- **Ring styles**: frosting, licorice, candy-dots
- **Shapes**: lollipop, gumdrop, pretzel, donut
- **Accents**: mini-sprinkles, cherries, drops, gumballs

#### Noir 🖤
- **Vibe**: Film noir, monochrome
- **boardBg**: solid / `#111111`
- **Palette**: bg `#111111, #333333, #666666` / ring `#222222, #444444, #777777, #555555` / shape `#222222, #666666, #444444` / accent `#222222, #666666, #333333`
- **v2 fixes**: Ring/shape/accent all changed from whites/light grays to dark grays (`#222-#777`). On Noir's dark boardBg, dark elements on white tiles create the intended contrast.
- **Ring styles**: sharp, etched, shadow
- **Shapes**: spade, crown, bolt-shape, mask
- **Accents**: crosshairs, slashes, corners, pins

#### Sepia 📜
- **Vibe**: Vintage parchment, antique
- **boardBg**: parchment / `#d4c4a8`
- **Palette**: bg `#d4c4a8, #c0a080, #a07850` / ring `#3e2723, #6b4423, #8b6914, #a0522d` / shape `#3e2723, #8b6914, #795548` / accent `#5c3a1e, #a0522d, #6d4c41`
- **v2 fixes**: Shape `#c49a6c` → `#795548`, accent `#d4a574` → `#6d4c41` (light tans → medium browns)
- **Ring styles**: ornate, worn, gilded
- **Shapes**: quill, compass, anchor, fleur
- **Accents**: filigree, rivets, scrolls, stamps

#### Neon 💡
- **Vibe**: Cyberpunk, electric glow
- **boardBg**: grid-lines / `#0d0221`
- **Palette**: bg `#0d0221, #1a0533, #2b0845` / ring `#ff00ff, #00ffff, #ff3366, #39ff14` / shape `#ff00ff, #00ffff, #39ff14` / accent `#ff3366, #ff6d00, #00ffff`
- **v2 fixes**: Accent `#ffff00` → `#ff6d00` (pure yellow → deep orange)
- **Ring styles**: neon-glow, pulse, wireframe
- **Shapes**: lightning, pixel-heart, pac-ghost, controller
- **Accents**: glitch-dots, brackets, pixels, signal-bars

#### Tropical 🌴
- **Vibe**: Island paradise, vibrant nature
- **boardBg**: waves / `#00bcd4`
- **Palette**: bg `#00bcd4, #ff7043, #ffca28` / ring `#e91e63, #4caf50, #ff9800, #2196f3` / shape `#e91e63, #4caf50, #ff9800` / accent `#f44336, #00bcd4, #e65100`
- **v2 fixes**: Accent `#ffeb3b` → `#e65100` (bright yellow → deep orange)
- **Ring styles**: lei, rope-twist, shell-border
- **Shapes**: flamingo, pineapple, hibiscus, surfboard
- **Accents**: coconuts, fish, waves-mini, shells

#### Indian 🪷
- **Vibe**: Traditional Indian motifs, rich heritage
- **boardBg**: solid / `#ff9933`
- **Palette**: bg `#ff9933, #138808, #4a0082` / ring `#d4af37, #b22222, #ff6f00, #1a5276` / shape `#d4af37, #b22222, #138808` / accent `#ff9933, #d4af37, #e91e63`
- **Ring styles**: zari-border, kolam, thread-wrap
- **Shapes**: diya, lotus, elephant, peacock
- **Accents**: bindis, bells, bangles, om-dots

#### Bollywood 🎬
- **Vibe**: Glamorous cinema, sequins and spotlights
- **boardBg**: solid / `#e91e63`
- **Palette**: bg `#e91e63, #ffd700, #6a1b9a` / ring `#ff4081, #ffc107, #00bcd4, #e040fb` / shape `#ff4081, #ffd700, #00bcd4` / accent `#e040fb, #ff5722, #ffc107`
- **Ring styles**: marquee-lights, bollywood-arch, sequin-border
- **Shapes**: filmi-star, filmi-heart, microphone, clapperboard
- **Accents**: music-notes, sparkles, cameras, roses

#### Arithmetic 🔢
- **Vibe**: Chalkboard math, classroom nostalgia
- **boardBg**: chalkboard / `#2e7d32`
- **Palette**: bg `#2e7d32, #fff8e1, #5d4037` / ring `#1a237e, #e65100, #ff7043, #42a5f5` / shape `#1a237e, #e65100, #42a5f5` / accent `#ff7043, #ef5350, #1a237e`
- **v2 fixes**: Ring `#ffffff, #ffeb3b` → `#1a237e, #e65100`. Shape `#ffffff, #ffeb3b` → `#1a237e, #e65100`. Accent `#ffffff` → `#1a237e`. (whites/yellows → navy/orange)
- **Ring styles**: ruler-marks, protractor, bracket-border
- **Shapes**: plus-sign, divide-symbol, pi-symbol, infinity
- **Accents**: equal-signs, percent, tally-marks, decimal-dots

#### Sky 🌈
- **Vibe**: Daytime sky, clouds and rainbows
- **boardBg**: sky-gradient / `#64b5f6`
- **Palette**: bg `#64b5f6, #90caf9, #fff176` / ring `#e53935, #ff9800, #4caf50, #7b1fa2` / shape `#e53935, #ff9800, #1565c0` / accent `#4caf50, #f48fb1, #ffb300`
- **Ring styles**: cloud-border, rainbow-ring, breeze-dash
- **Shapes**: airplane, songbird, bright-sun, kite
- **Accents**: tiny-birds, butterflies, raindrops, drifting-leaves

#### Street Food 🍕
- **Vibe**: Food trucks, warm spices, playful culinary chaos
- **boardBg**: checkered-tablecloth / `#d84315`
- **Palette**: bg `#d84315, #f9a825, #2e7d32` / ring `#bf360c, #f57f17, #1b5e20, #4e342e` / shape `#f57f17, #1b5e20, #bf360c` / accent `#4e342e, #1b5e20, #ff6e40`
- **v2 fixes**: Shape `#ffffff` → `#f57f17`, accent `#ffeb3b, #ffffff` → `#4e342e, #1b5e20` (whites/yellows → dark browns/greens)
- **Ring styles**: pretzel-twist, sauce-drizzle, chopstick-border
- **Shapes**: pizza-slice, taco, boba-cup, soft-pretzel
- **Accents**: sesame-seeds, chili-flakes, crumbs, steam-wisps

#### Arctic ❄️
- **Vibe**: Icy tundra, cool-tone complement to Tropical's warm palette
- **boardBg**: ice-crystals / `#1565c0`
- **Palette**: bg `#1565c0, #e1f5fe, #b39ddb` / ring `#0d47a1, #00838f, #6a1b9a, #1b5e20` / shape `#0d47a1, #c62828, #1b5e20` / accent `#0d47a1, #4a148c, #00695c`
- **v2 fixes**: Accent `#b3e5fc, #ffffff, #80deea` → `#0d47a1, #4a148c, #00695c` (pastels/white → deep dark colors)
- **Ring styles**: frost-border, icicle-ring, snowdrift-edge
- **Shapes**: snowflake, penguin, igloo, polar-bear
- **Accents**: ice-shards, snowflakes-tiny, frost-dots, icicle-drops
