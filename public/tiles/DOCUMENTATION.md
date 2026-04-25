# Photo Tiles Game — Developer Documentation

> **Parent doc**: [../../DOCUMENTATION.md](../../DOCUMENTATION.md) (project-wide architecture, deployment, common tasks)

---

## Overview

A pattern-matching tile puzzle (5×5 = 25 tiles, 24 active + 1 decorative center). Match tiles by shared visual attributes to clear them. A surprise photo reveals underneath as tiles are cleared (jigsaw-style). Originally built as "Fatema Tiles" (source: `C:\Users\huseinm\Downloads\fatema-tiles`).

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
  - Animates center heart out on win
- `engine.js` — Board generation, game logic & **16-theme system** (~448 lines)
  - Constants: `ROWS=5, COLS=5, TILE_COUNT=25, ACTIVE_TILES=24, CENTER_INDEX=12`
  - `THEMES` array defines all 16 themes (palette, patterns, styles, shapes, accents, **boardBg**)
  - `buildPools(theme)` — generates 3 attribute pools of 12 items each from a theme
  - `generateBoard()` — picks random theme, builds pools, creates paired 24-tile board + center heart
  - `GameState` class — manages board, matching, scoring; tracks `currentTheme`
- `renderer.js` — SVG tile rendering (~1870 lines) — **THE KEY FILE**
  - `renderBg()` (lines 18-655) — background patterns (board-level, non-matchable)
  - `renderRing()` (lines 657-947) — ring border styles (48 cases: 16 themes × 3)
  - `renderShape()` (lines 948-1413) — center shape icons (64+ cases: 16 themes × 4)
  - `renderAccent()` (lines 1414-1759) — corner accent decorations (64+ cases: 16 themes × 4)
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

**Current boardBg assignments:**
| Theme | Pattern | Color | Notes |
|-------|---------|-------|-------|
| Azulejo | checkerboard | #66BB6A | Green checkerboard |
| Celestial | solid | #1a237e | Deep navy, no pattern |
| Garden | solid | #4caf50 | Green, no pattern |
| Deco | solid | #ffb300 | Amber, no pattern |
| Mosaic | solid | #8d6e63 | Brown, no pattern |
| Candy | gingham | #f06292 | Pink gingham |
| Noir | solid | #111111 | Near-black, no pattern |
| Sepia | parchment | #d4c4a8 | Tan parchment texture |
| Neon | grid-lines | #0d0221 | Dark purple grid |
| Tropical | waves | #00bcd4 | Cyan waves |
| Indian | solid | #ff9933 | Saffron, no pattern |
| Bollywood | solid | #e91e63 | Pink, no pattern |
| Arithmetic | chalkboard | #2e7d32 | Green chalkboard |
| Sky | sky-gradient | #64b5f6 | Blue sky gradient |
| Street Food | checkered-tablecloth | #d84315 | Red/white checks |
| Arctic | ice-crystals | #1565c0 | Blue ice crystals |

**Why 7 themes use 'solid':** Originally all had decorative patterns, but several caused visual confusion — players mistook bg pattern elements for matchable game elements (e.g., Bollywood's spotlight had concentric circles that looked like ring elements). Solid themes get only the white base + 12% color tint.

## Gameplay
1. Start: 24 randomly generated tiles on a 5×5 grid (center = decorative h❤f heart) — theme chosen randomly
2. Theme name + emoji shown briefly as a toast overlay (e.g. "🌙 Celestial")
3. Tap two tiles that share at least one visual attribute (ring, shape, or accent) to match them
4. Matched tiles fade out, revealing a photo underneath (jigsaw reveal)
5. Track combo streaks and clear all 24 tiles to win
6. "✨ New" button starts a fresh board with a new random theme + random photo

### Score Display
- Current combo, best combo, tiles cleared (X/24)

---

## New Theme Creation Guide

### Why This Guide Exists

Over 16 themes and 2 major architecture revisions, we hit **7 distinct bug classes** that all shipped or nearly shipped to production. This guide documents every pitfall so they aren't repeated.

### Architecture Quick Reference (v2)

```
engine.js (THEMES array)                renderer.js (SVG rendering)
────────────────────────────            ──────────────────────────────
Theme {                                 renderBg(attr)     → board-level bg (NOT matchable)
  name, emoji,                          renderRing(attr)   → case per ringStyle  (matchable)
  palette: {                            renderShape(attr)  → case per shapeName  (matchable)
    bg:     [3 colors],                 renderAccent(attr) → case per accentShape (matchable)
    ring:   [4 colors],
    shape:  [3 colors],                 Each case returns an SVG string fragment.
    accent: [3 colors],                 Pattern names in engine.js MUST have a matching
  },                                    case in renderer.js.
  bgPatterns:   [5],     ← for board bg only (not pools)
  ringStyles:   [3],     ← 4 colors × 3 styles = 12 pool items
  shapeNames:   [4],     ← 4 shapes × 3 colors = 12 pool items
  accentShapes: [4],     ← 4 accents × 3 colors = 12 pool items
  boardBg: { pattern: 'xxx', color: '#hex' },
}
```

**Pool math**: Each matchable dimension generates `variants × colors = 12` items (duplicated to 24 for matching pairs on the 5×5 board with center heart). This is non-negotiable — the game requires exactly 12 per pool.

### Principles

#### 1. Visibility-First Color Selection

**THE #1 PITFALL**: Tile backgrounds are `white + 12% color tint` — essentially near-white. Any matchable element color that's also light will be invisible.

**Color luminance rule**: Every ring, shape, and accent color MUST have sufficient contrast against near-white. In practice:
- ✅ Use colors with HSL lightness ≤ 50% (Material Design 600-900 range)
- ✅ Good examples: `#1565c0` (dark blue), `#e65100` (deep orange), `#4a148c` (deep purple)
- ❌ Bad examples: `#ffffff` (white), `#ffeb3b` (bright yellow), `#b3e5fc` (light blue), `#80deea` (light teal)
- ❌ Avoid: pastels, whites, bright yellows, light grays (`#cccccc` and lighter)

**Colors that FAILED in production** (invisible on near-white tiles):
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

#### 2. Element Size & Opacity Minimums

**Global enforced thresholds** (applied across ALL themes):

| Element Type | Attribute | Minimum | Why |
|-------------|-----------|---------|-----|
| Ring | `stroke-width` | 2.5 | Thinner strokes disappear at game zoom levels |
| Ring | `opacity` | 0.6 | Lower opacity blends into background |
| Accent | `opacity` | 0.6 | Must be clearly visible in corners |
| Accent | `r` (circle radius) | 2.5 | Smaller circles become invisible dots |
| Accent | `stroke-width` | 1.5 | Stroked-only accents need visible lines |
| Shape | `opacity` | 0.85 (convention) | Center shapes must dominate the tile |

**How enforced**: These were applied via regex sweep across the renderer function ranges. When adding new cases, manually verify your SVG attributes meet these thresholds. The validator does NOT currently check individual SVG attribute values — this is a manual discipline.

**Reference "good" elements** (copy these patterns):
- Ring: Azulejo `solid` — `stroke-width="5"`, full opacity
- Accent: Azulejo `circles` — `r="7"`, full opacity, solid fill
- Shape: Most shapes use `const o = 0.85` — strong and clear

#### 3. Background Pattern Safety

**The confusion problem**: Players mistake board background pattern elements for matchable game elements. This happened with:
- Bollywood `spotlight` pattern: had concentric circles → looked like ring elements
- Several themes had complex patterns with geometric shapes resembling game shapes

**Rules for board bg patterns:**
- ✅ **Solid** is safest — just color tint, no confusion possible
- ✅ Subtle, obviously-themed patterns are OK: waves, gingham, chalkboard lines, ice crystals
- ❌ Never use circles, rings, or geometric shapes in bg patterns — they'll be confused with rings/shapes
- ❌ Never use corner-positioned elements in bg patterns — they'll be confused with accents
- The bg pattern opacity is globally set to 0.35, with hardcoded overrides reduced to 0.3 for heavy patterns

**When in doubt, use `'solid'`** — 7 of 16 themes use solid backgrounds and look great.

#### 4. Cross-Palette Color Collision

Every color within a palette group must be **visually distinct**. But also check ACROSS groups:
- If a ring color matches a shape color in the same theme, players can't distinguish which dimension matched
- If an accent color matches the board bg tint color, accents disappear into the background

### Step-by-Step Checklist

#### Step 1: Define the Theme Object (engine.js)

Add a new entry to the `THEMES` array:

```javascript
{
  name: 'MyTheme', emoji: '🎯',
  palette: {
    bg:     ['#hex1', '#hex2', '#hex3'],                     // 3 DISTINCT bg colors (for future use)
    ring:   ['#hex1', '#hex2', '#hex3', '#hex4'],             // 4 DISTINCT dark/medium colors
    shape:  ['#hex1', '#hex2', '#hex3'],                      // 3 DISTINCT dark/medium colors
    accent: ['#hex1', '#hex2', '#hex3'],                      // 3 DISTINCT dark/medium colors
  },
  bgPatterns:   ['pat1', 'pat2', 'pat3', 'pat4', 'pat5'],    // exactly 5 (for renderBg)
  ringStyles:   ['ring1', 'ring2', 'ring3'],                  // exactly 3
  shapeNames:   ['shape1', 'shape2', 'shape3', 'shape4'],     // exactly 4
  accentShapes: ['acc1', 'acc2', 'acc3', 'acc4'],             // exactly 4
  boardBg:      { pattern: 'pat1', color: '#hex' },           // which bg pattern to use board-wide
}
```

**Rules:**
- ✅ Ring/shape/accent colors: HSL lightness ≤ 50% (dark/medium — NO pastels, whites, or bright yellows)
- ✅ Every color within a palette group must be **visually distinct** (no duplicates, no near-duplicates)
- ✅ Every pattern/shape/style name must be **globally unique** across ALL themes in that dimension
- ✅ Count must be exact: 5 bgPatterns, 3 ringStyles, **4** shapeNames, **4** accentShapes
- ✅ Palette counts must be exact: 3 bg, **4** ring, 3 shape, 3 accent
- ✅ `boardBg.pattern` must be one of the names in `bgPatterns` OR `'solid'`
- ✅ `boardBg.color` should be the theme's primary/dominant color

**How to check name uniqueness:** Search renderer.js for `case 'yourname'`. If it already exists in the same render function, pick a different name (prefix with theme, e.g. `filmi-star` instead of `star`).

#### Step 2: Add Renderer Cases (renderer.js)

For each new pattern name, add a `case` block in the corresponding function:

| Pattern Array | Renderer Function | Cases Needed | Matchable? |
|--------------|-------------------|-------------|------------|
| `bgPatterns[5]` | `renderBg()` | 5 new cases | No (board-level only) |
| `ringStyles[3]` | `renderRing()` | 3 new cases | **Yes** |
| `shapeNames[4]` | `renderShape()` | 4 new cases | **Yes** |
| `accentShapes[4]` | `renderAccent()` | 4 new cases | **Yes** |

**Total: 16 new case blocks per theme.**

**Rules for matchable elements (ring, shape, accent):**
- ✅ Ring: `stroke-width` ≥ 2.5, `opacity` ≥ 0.6
- ✅ Shape: use `const o = 0.85` convention for fill opacity
- ✅ Accent: `opacity` ≥ 0.6, circle `r` ≥ 2.5, `stroke-width` ≥ 1.5
- ✅ Accents render at `CORNERS = [[16,16],[84,16],[16,84],[84,84]]` — 4 corners
- ✅ Add cases BEFORE the `default:` line in each function
- ✅ Every case must `return` (or `break` with `out +=`) an SVG string — never fall through to blank
- ✅ Do NOT accidentally delete the closing `}` of the switch or function
- ✅ If your SVG needs randomness, use `mulberry32(c.charCodeAt(1))` — already defined at top of file
- ✅ The SVG viewBox is `0 0 100 100` — keep all coordinates within this space

**Template for a ring case:**
```javascript
    // ── MyTheme ──
    case 'my-border': {
      const c = attr.color;
      return `<rect x="3" y="3" width="94" height="94" rx="10" fill="none" stroke="${c}" stroke-width="4" opacity="0.8"/>`;
    }
```

**Template for a shape case:**
```javascript
    case 'my-icon': {
      const c = attr.color;
      const o = 0.85;
      return `<circle cx="50" cy="50" r="18" fill="${c}" opacity="${o}"/>`;
    }
```

**Template for an accent case:**
```javascript
    case 'my-dots':
      out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}" opacity="0.7"/>`; break;
```

#### Step 3: Run the Validator

```bash
node validate-themes.js
```

This script checks ALL of the following automatically:

| Check | What It Catches |
|-------|----------------|
| Pool math (4×3=12) | Wrong number of patterns/colors (would break board generation) |
| Cross-theme name uniqueness | Duplicate case labels (second one silently unreachable in JS) |
| Engine → Renderer coverage | Pattern defined in engine.js but no case in renderer.js (blank tiles) |
| Duplicate case labels | Same case label appears twice in one function |
| Function dependencies | Calling undefined functions like mulberry32 (ReferenceError) |
| Syntax check | Missing braces, unclosed strings, malformed JS |
| Color distinctness | Identical hex codes in same palette group (unsolvable game) |
| Background hue diversity | All 3 bg colors are shades of same hue (40° min hue spread) |
| boardBg validation | Every theme has a boardBg property with pattern and color |
| Orphan cases | Cases in renderer with no theme using them (warning, not error) |

**The validator must show all 10 green ✅ before committing.**

**What the validator does NOT check** (manual discipline required):
- Color lightness/contrast against white tile background
- SVG element sizes meeting minimum thresholds
- Visual confusion between bg patterns and matchable elements
- Cross-palette color collisions (ring color = shape color)

#### Step 4: Manual Smoke Test

Even with the validator passing, do a visual check:

1. Run locally: `node server.js` → open `http://localhost:3000/tiles/`
2. Click through themes until you hit yours (or modify code to force your theme)
3. **Visibility check**: Can you immediately distinguish every ring style? Every accent? Every shape?
4. **Squint test**: Squint at the board. If any tiles look identical to each other, contrast is too low
5. **Background check**: Does any bg pattern element look like a ring, shape, or accent?
6. **Center tile**: Does the h❤f heart render with theme colors and animate?
7. Start a game, make a few matches — verify matched tiles disappear and photo reveals
8. Check mobile viewport (responsive layout)

#### Step 5: Commit and Deploy

```bash
node validate-themes.js                    # Must pass first!
git add public/tiles/engine.js public/tiles/renderer.js validate-themes.js
git commit -m "Add [ThemeName] theme to Photo Tiles"
git push
```

Wait ~2 min for Render auto-deploy. Hard-refresh (Ctrl+Shift+R) the live site to bypass cache.

### Common Pitfalls Reference

| # | Pitfall | Example | How to Avoid |
|---|---------|---------|-------------|
| 1 | **Light colors invisible on white tiles** | Arctic accents `#b3e5fc` on near-white bg | Use only dark/medium colors (lightness ≤ 50%) for ring/shape/accent palettes |
| 2 | **Bright yellow invisible** | `#ffeb3b` or `#ffff00` as accent | Yellow is the worst offender — always substitute deep orange (`#e65100`) or amber (`#ff8f00`) |
| 3 | **White as element color** | `#ffffff` ring in Arithmetic | White on white = invisible. Use darkest theme-appropriate color instead |
| 4 | **Bg pattern confused with game elements** | Bollywood spotlight circles ≈ ring elements | Use solid bg or very subtle patterns; no circles/rings/geometric shapes in bg |
| 5 | **Thin strokes / small accents** | Ring stroke-width=1.2, accent r=1.5 | Enforce minimums: ring stroke ≥ 2.5, accent r ≥ 2.5, accent stroke ≥ 1.5 |
| 6 | **Low opacity elements** | Accent opacity=0.3 | Enforce minimums: ring opacity ≥ 0.6, accent opacity ≥ 0.6, shape opacity ≥ 0.85 |
| 7 | **Duplicate case name** | Two themes both use `'star'` as a shape | Prefix with theme: `'filmi-star'`, `'celtic-star'` |
| 8 | **Missing helper function** | Case calls `mulberry32()` but not defined | Validator CHECK 6 catches this |
| 9 | **Deleted closing brace** | Adding cases at end of switch, accidentally removing `}` | Validator syntax check catches this |
| 10 | **Identical palette colors** | `ring: ['#333', '#333', '#333', '#333']` | Validator color check catches this |
| 11 | **Wrong pattern count** | 3 ringStyles instead of 3 | Validator pool math catches this |
| 12 | **Case with no return** | `case 'x': { /* forgot return */ }` | Manual check — look for fall-through |

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
The game now has 16 diverse themes on a streamlined 5×5 / 3-dimension architecture. Background is board-level, visibility minimums are enforced, and the h❤f center tile adds personality. Future expansion should explore two directions: (1) **Pattern Mode** — a fundamentally different engine mode for monochrome themes, and (2) **UX enhancements** that improve the gameplay experience.

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

## Appendix A: Theme Palette Reference (v2 — Current)

Each theme defines: palette (bg 3 / ring 4 / shape 3 / accent 3), 5 bg patterns, 3 ring styles, **4** center shapes, **4** corner accents, and a `boardBg` assignment.

> **v2 changes from v1**: Ring palette reduced 5→4 colors. shapeNames reduced 5→4. accentShapes reduced 5→4. Added `boardBg` per theme. Several themes had palette colors replaced for visibility (see Bug Fixes History).

#### Theme 1: Azulejo 🎨 (original)
- **Vibe**: Portuguese ceramic tiles
- **boardBg**: checkerboard / `#66BB6A`
- **Palette**: bg `#66BB6A, #F06292, #FFB300` / ring `#2E7D32, #C2185B, #1565C0, #6A1B9A` / shape `#43A047, #E91E63, #1E88E5` / accent `#FF6D00, #00ACC1, #AB47BC`
- **Ring styles**: solid, dashed, double
- **Shapes**: cross, flower, star, diamond
- **Accents**: circles, diamonds, squares, triangles

#### Theme 2: Celestial 🌙
- **Vibe**: Night sky, cosmic
- **boardBg**: solid / `#1a237e`
- **Palette**: bg `#1a237e, #4a148c, #ff8f00` / ring `#455a64, #ffab00, #00838f, #e040fb` / shape `#00838f, #e040fb, #ffab00` / accent `#5c6bc0, #00838f, #e65100`
- **v2 fixes**: Ring `#90a4ae` → `#455a64`, accent `#b0bec5` → `#5c6bc0`, `#ffd740` → `#e65100`
- **Ring styles**: glow, dotted, eclipse
- **Shapes**: crescent, starburst, hexagon, saturn
- **Accents**: tiny-stars, sparks, orbs, carets

#### Theme 3: Garden 🌿
- **Vibe**: Botanical, floral
- **boardBg**: solid / `#4caf50`
- **Palette**: bg `#4caf50, #ba68c8, #fbc02d` / ring `#2e7d32, #7b1fa2, #ef6c00, #00838f` / shape `#43a047, #ab47bc, #ff7043` / accent `#ff6f00, #00897b, #d81b60`
- **Ring styles**: vine, thorn, ribbon
- **Shapes**: heart, tulip, leaf, raindrop
- **Accents**: seeds, dewdrops, buds, rosettes

#### Theme 4: Deco ✨
- **Vibe**: Art Deco geometric
- **boardBg**: solid / `#ffb300`
- **Palette**: bg `#ffb300, #4db6ac, #e57373` / ring `#bf360c, #1b5e20, #4a148c, #01579b` / shape `#d84315, #1b5e20, #283593` / accent `#ff6f00, #2e7d32, #6a1b9a`
- **Ring styles**: thick-thin, dotted-line, fillet
- **Shapes**: arch, bowtie, pentagon, keystone
- **Accents**: rays, studs, arrows, wings

#### Theme 5: Mosaic 🏺
- **Vibe**: Terracotta tessellation
- **boardBg**: solid / `#8d6e63`
- **Palette**: bg `#8d6e63, #4db6ac, #ffb74d` / ring `#d84315, #00695c, #f9a825, #283593` / shape `#bf360c, #00897b, #f57f17` / accent `#e65100, #00838f, #827717`
- **Ring styles**: rope, notched, inset
- **Shapes**: octagon, arrow-shape, hourglass, shield
- **Accents**: plus-signs, arrowheads, wedges, pips

#### Theme 6: Candy 🍬
- **Vibe**: Sweet shop, playful
- **boardBg**: gingham / `#f06292`
- **Palette**: bg `#f06292, #81c784, #ffcc80` / ring `#c2185b, #00897b, #ff6f00, #6a1b9a` / shape `#e91e63, #00bfa5, #ff9100` / accent `#d81b60, #00acc1, #ff6d00`
- **Ring styles**: frosting, licorice, candy-dots
- **Shapes**: lollipop, gumdrop, pretzel, donut
- **Accents**: mini-sprinkles, cherries, drops, gumballs

#### Theme 7: Noir 🖤
- **Vibe**: Film noir, monochrome
- **boardBg**: solid / `#111111`
- **Palette**: bg `#111111, #333333, #666666` / ring `#222222, #444444, #777777, #555555` / shape `#222222, #666666, #444444` / accent `#222222, #666666, #333333`
- **v2 fixes**: Ring/shape/accent all changed from whites/light grays to dark grays (`#222-#777`). On Noir's dark boardBg, dark elements on white tiles create the intended contrast.
- **Ring styles**: sharp, etched, shadow
- **Shapes**: spade, crown, bolt-shape, mask
- **Accents**: crosshairs, slashes, corners, pins

#### Theme 8: Sepia 📜
- **Vibe**: Vintage parchment, antique
- **boardBg**: parchment / `#d4c4a8`
- **Palette**: bg `#d4c4a8, #c0a080, #a07850` / ring `#3e2723, #6b4423, #8b6914, #a0522d` / shape `#3e2723, #8b6914, #795548` / accent `#5c3a1e, #a0522d, #6d4c41`
- **v2 fixes**: Shape `#c49a6c` → `#795548`, accent `#d4a574` → `#6d4c41` (light tans → medium browns)
- **Ring styles**: ornate, worn, gilded
- **Shapes**: quill, compass, anchor, fleur
- **Accents**: filigree, rivets, scrolls, stamps

#### Theme 9: Neon 💡
- **Vibe**: Cyberpunk, electric glow
- **boardBg**: grid-lines / `#0d0221`
- **Palette**: bg `#0d0221, #1a0533, #2b0845` / ring `#ff00ff, #00ffff, #ff3366, #39ff14` / shape `#ff00ff, #00ffff, #39ff14` / accent `#ff3366, #ff6d00, #00ffff`
- **v2 fixes**: Accent `#ffff00` → `#ff6d00` (pure yellow → deep orange)
- **Ring styles**: neon-glow, pulse, wireframe
- **Shapes**: lightning, pixel-heart, pac-ghost, controller
- **Accents**: glitch-dots, brackets, pixels, signal-bars

#### Theme 10: Tropical 🌴
- **Vibe**: Island paradise, vibrant nature
- **boardBg**: waves / `#00bcd4`
- **Palette**: bg `#00bcd4, #ff7043, #ffca28` / ring `#e91e63, #4caf50, #ff9800, #2196f3` / shape `#e91e63, #4caf50, #ff9800` / accent `#f44336, #00bcd4, #e65100`
- **v2 fixes**: Accent `#ffeb3b` → `#e65100` (bright yellow → deep orange)
- **Ring styles**: lei, rope-twist, shell-border
- **Shapes**: flamingo, pineapple, hibiscus, surfboard
- **Accents**: coconuts, fish, waves-mini, shells

#### Theme 11: Indian 🪷
- **Vibe**: Traditional Indian motifs, rich heritage
- **boardBg**: solid / `#ff9933`
- **Palette**: bg `#ff9933, #138808, #4a0082` / ring `#d4af37, #b22222, #ff6f00, #1a5276` / shape `#d4af37, #b22222, #138808` / accent `#ff9933, #d4af37, #e91e63`
- **Ring styles**: zari-border, kolam, thread-wrap
- **Shapes**: diya, lotus, elephant, peacock
- **Accents**: bindis, bells, bangles, om-dots

#### Theme 12: Bollywood 🎬
- **Vibe**: Glamorous cinema, sequins and spotlights
- **boardBg**: solid / `#e91e63`
- **Palette**: bg `#e91e63, #ffd700, #6a1b9a` / ring `#ff4081, #ffc107, #00bcd4, #e040fb` / shape `#ff4081, #ffd700, #00bcd4` / accent `#e040fb, #ff5722, #ffc107`
- **Ring styles**: marquee-lights, bollywood-arch, sequin-border
- **Shapes**: filmi-star, filmi-heart, microphone, clapperboard
- **Accents**: music-notes, sparkles, cameras, roses

#### Theme 13: Arithmetic 🔢
- **Vibe**: Chalkboard math, classroom nostalgia
- **boardBg**: chalkboard / `#2e7d32`
- **Palette**: bg `#2e7d32, #fff8e1, #5d4037` / ring `#1a237e, #e65100, #ff7043, #42a5f5` / shape `#1a237e, #e65100, #42a5f5` / accent `#ff7043, #ef5350, #1a237e`
- **v2 fixes**: Ring `#ffffff, #ffeb3b` → `#1a237e, #e65100`. Shape `#ffffff, #ffeb3b` → `#1a237e, #e65100`. Accent `#ffffff` → `#1a237e`. (whites/yellows → navy/orange)
- **Ring styles**: ruler-marks, protractor, bracket-border
- **Shapes**: plus-sign, divide-symbol, pi-symbol, infinity
- **Accents**: equal-signs, percent, tally-marks, decimal-dots

#### Theme 14: Sky 🌈
- **Vibe**: Daytime sky, clouds and rainbows
- **boardBg**: sky-gradient / `#64b5f6`
- **Palette**: bg `#64b5f6, #90caf9, #fff176` / ring `#e53935, #ff9800, #4caf50, #7b1fa2` / shape `#e53935, #ff9800, #1565c0` / accent `#4caf50, #f48fb1, #ffb300`
- **Ring styles**: cloud-border, rainbow-ring, breeze-dash
- **Shapes**: airplane, songbird, bright-sun, kite
- **Accents**: tiny-birds, butterflies, raindrops, drifting-leaves

#### Theme 15: Street Food 🍕
- **Vibe**: Food trucks, warm spices, playful culinary chaos
- **boardBg**: checkered-tablecloth / `#d84315`
- **Palette**: bg `#d84315, #f9a825, #2e7d32` / ring `#bf360c, #f57f17, #1b5e20, #4e342e` / shape `#f57f17, #1b5e20, #bf360c` / accent `#4e342e, #1b5e20, #ff6e40`
- **v2 fixes**: Shape `#ffffff` → `#f57f17`, accent `#ffeb3b, #ffffff` → `#4e342e, #1b5e20` (whites/yellows → dark browns/greens)
- **Ring styles**: pretzel-twist, sauce-drizzle, chopstick-border
- **Shapes**: pizza-slice, taco, boba-cup, soft-pretzel
- **Accents**: sesame-seeds, chili-flakes, crumbs, steam-wisps

#### Theme 16: Arctic ❄️
- **Vibe**: Icy tundra, cool-tone complement to Tropical's warm palette
- **boardBg**: ice-crystals / `#1565c0`
- **Palette**: bg `#1565c0, #e1f5fe, #b39ddb` / ring `#0d47a1, #00838f, #6a1b9a, #1b5e20` / shape `#0d47a1, #c62828, #1b5e20` / accent `#0d47a1, #4a148c, #00695c`
- **v2 fixes**: Accent `#b3e5fc, #ffffff, #80deea` → `#0d47a1, #4a148c, #00695c` (pastels/white → deep dark colors)
- **Ring styles**: frost-border, icicle-ring, snowdrift-edge
- **Shapes**: snowflake, penguin, igloo, polar-bear
- **Accents**: ice-shards, snowflakes-tiny, frost-dots, icicle-drops
