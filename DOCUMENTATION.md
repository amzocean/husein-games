# Husein and Fatema's Game Room — Developer Documentation

## 1. Introduction & Project Context

This is a personal game portal built for Husein and Fatema — a romantic-themed website at **huseinlovesyou.com** that hosts 3 browser games. It's a single Node.js process (Express + Socket.IO) deployed on Render.com's free tier.

**The 3 games:**
- **💌 Valentines** — A love-letter puzzle adventure (single-player, fully static, 6 levels)
- **🧩 Photo Tiles** — A pattern-matching tile puzzle with 14 procedurally-rendered SVG themes (single-player, no server logic)
- **🎲 Ludo** — Classic board game, 2-4 players, real-time multiplayer via Socket.IO with Canvas rendering

**What a new session needs to know immediately:**
- The Photo Tiles game is the most actively developed — it has 14 visual themes, each requiring ~18 SVG render cases in `renderer.js` (~1520 lines). Theme work is where most bugs have occurred (see Bug Fixes History and the Standard Process for Adding Themes).
- Ludo's server logic has **5 separate code paths** that complete a token move. Any change to post-move behavior (extra turns, win checks, captures) MUST be applied to all 5. This is the #1 source of Ludo bugs.
- The site runs on Render free tier — no persistent storage, auto-deploys on push to `main`, 30s cold starts.
- Git pushes use the **browser-based credential manager** (personal GitHub account `amzocean`). The `gh` CLI is linked to a work account — do NOT use it for this repo.

## 2. Documentation Method

This document is written for **AI session continuity** — its primary audience is a fresh Copilot session picking up where the last one left off. The focus is:

- **Design decisions and their rationale** — not just what was built, but WHY this approach was chosen and what alternatives were rejected
- **Pitfalls and anti-patterns** — mistakes that were actually made in production, documented so they aren't repeated. Each bug fix entry includes the root cause analysis, not just the symptom and fix
- **Architecture constraints** — the non-obvious rules that, if violated, cause subtle bugs (e.g., the 5 code paths that must stay in sync, transient state that must be cleared after exactly one broadcast)
- **Thought process and implementation details** — code is readable on its own; this doc captures the reasoning that code can't express

When updating this documentation: don't just record WHAT changed. Record WHY, what was considered and rejected, and what a future developer would need to know to avoid breaking things.

## 3. Quick Resume Checklist

- **Local project**: `C:\Users\huseinm\Downloads\husein-games\`
- **GitHub repo**: https://github.com/amzocean/husein-games.git (personal account: amzocean)
- **Live URL**: https://huseinlovesyou.com (custom domain) / https://husein-games.onrender.com (Render direct)
- **Render dashboard**: https://dashboard.render.com (free tier, auto-deploys on push to main)
- **Tiles validator**: `node validate-themes.js` — run before every tiles commit (10 checks, all must pass)
- **⚠️ DO NOT modify gh CLI auth** — `gh` is linked to work account `huseinm_microsoft`. Git pushes use browser-based credential manager.

---

## 4. Architecture Overview

Single Node.js process serving everything:
- **Express** serves static files from `public/` (landing page + 3 games)
- **Socket.IO** provides real-time multiplayer for Ludo via `/ludo` namespace
- Deployed on **Render.com free tier** (spins down after 15min of no HTTP requests, ~30s cold start)

```
husein-games/
├── server.js              # Express + Socket.IO server (~595 lines)
├── package.json           # express ^4.18.2, socket.io ^4.7.4
├── .gitignore             # node_modules, package-lock.json
└── public/
    ├── index.html          # Landing page with 3 game cards
    ├── valentines/         # Valentine puzzle game (static, single-player)
    │   ├── index.html      # Self-contained: HTML + CSS + JS inline
    │   ├── images/         # level1-5.jpg, final.jpg
    │   └── music.mp3       # Background music
    ├── tiles/              # Photo tiles game (static, single-player)
    │   ├── index.html      # PWA-capable sliding tile puzzle
    │   ├── style.css       # Styles (incl. theme toast)
    │   ├── app.js          # Main controller (ES modules, theme toast display)
    │   ├── engine.js       # Board generation, game logic, 6-theme system (~300 lines)
    │   ├── renderer.js     # SVG tile rendering — 6 themes, ~90 visual elements (~608 lines)
    │   ├── photos.js       # Photo loader from manifest
    │   ├── photos/         # 5 personal photos + manifest.json
    │   ├── manifest.json   # PWA manifest
    │   └── sw.js           # Service worker
    └── ludo/
        └── index.html      # Ludo client: HTML + CSS + JS + Canvas (915 lines)
```

### Key Technical Decisions
- Socket.IO namespace `/ludo` (`io.of('/ludo')` on server, `io('/ludo')` on client) — keeps Ludo traffic separate
- `broadcastState()` uses `ludoNs.emit()` (namespace-scoped, not global)
- **Cache-busting middleware** runs BEFORE `express.static`: sets `Cache-Control: no-cache` on `.html` files and directory-root requests (`/`, `/ludo/`, etc.). This forces browsers to revalidate on every visit — if the file hasn't changed, server returns 304 (no body, ~200 bytes), so performance cost is negligible. Without this, mobile browsers (esp. iOS Safari) would serve stale HTML for hours/days after a deploy.
- Static files served with `express.static(path.join(__dirname, 'public'))` — MUST use `path.join` for Render (relative paths fail)
- Game state is **in-memory only** — Render process restart = game state lost
- `process.env.PORT || 3000` — Render assigns its own port

---

## 2. Git & Deployment

### GitHub
- **Repo**: https://github.com/amzocean/husein-games.git
- **Branch**: `main` (only branch)
- **Remote**: `origin` → `https://github.com/amzocean/husein-games.git`
- **Auth**: Browser-based credential manager (NOT gh CLI — that's work account)
- **Push workflow**: `cd ~/Downloads/husein-games && git add -A && git commit -m "msg" && git push`

### Render.com
- **Service**: husein-games (Web Service, free tier)
- **URL**: https://huseinlovesyou.com (custom domain) / https://husein-games.onrender.com (direct)
- **Auto-deploy**: Connected to GitHub repo, deploys on every push to `main`
- **Build command**: `npm install`
- **Start command**: `node server.js`
- **Environment**: Node.js, uses `process.env.PORT`
- **Free tier behavior**: Spins down after 15min of no HTTP requests. Socket.IO heartbeats (every 25s) keep it alive while players are connected.

### Git History (oldest → newest)
```
703bbd8 Initial commit - game portal with 3 games
9542985 Fix static file path for Render deployment
f51500b Fix tokenIndex parameter mismatch in move handler
e6e9efd Add 1s delay before auto-move so dice value is visible
eb02939 Increase idle timeout to 30 minutes
83565fc Fix premature game ending: 3min disconnect grace + auto-reconnect on tab focus
712d728 Increase disconnect grace to 15 minutes
0cfa3c2 Auto-play after 1 min idle: auto-roll dice and auto-pick random token
657be8f Single 1-min auto-play timer covers entire turn (roll + pick)
4665d51 Auto-hide capture banner after 3 seconds
f5482dd Add spectator mode: non-players see live board without controls
...      Documentation, name change, theme commits
b096486 Ludo romantic retheme with rose/gold/teal/plum player colors
06ca0ea Fix color contrast: much lighter lights, darker darks, update center triangles
5226c8e Hide debug behind 5-tap secret, add Exit Game + End Game (creator only)
10dbaea Disable debug panel activation (code preserved, commented out)
b07d8a6 Change plum to indigo blue for better contrast with rose
3c3e6fc Documentation update
3182743 Add 6-theme system to Photo Tiles game
95216c6 Update documentation with 6-theme Photo Tiles system
df501e6 Ludo: RGBY colors, extra turn on home, fix capture banner
ce899c4 Add no-cache headers for HTML files to prevent stale deploys
28d159e Documentation: RGBY colors, extra turn on home, capture fix, caching, design pitfalls
1d89c82 Add Documentation Method header — developer-focused writing guidelines
3a9e62a Fix wording: thought process AND implementation details
fe35753 fix(tiles): improve theme contrast for 7 washed-out themes
```

### Custom Domain
- **Domain**: `huseinlovesyou.com` (registered on GoDaddy)
- **DNS provider**: GoDaddy (default nameservers)
- **DNS records**:
  - `A` record: `@` → `216.24.57.1` (Render's load balancer IP), TTL 600s
  - `CNAME` record: `www` → `husein-games.onrender.com`, TTL 1hr
- **Render custom domains**: Both `huseinlovesyou.com` and `www.huseinlovesyou.com` verified with SSL certificates issued (Let's Encrypt)
- **Routing**: `huseinlovesyou.com` redirects to `www.huseinlovesyou.com`
- **Previous hosting**: Was on Netlify (removed domain from Netlify to clear Cloudflare DNS interference)
- **Cache busting**: If users see old cached version, append `?v=2` to URL or clear browser cache

---

## 3. Landing Page (`public/index.html`)

- **Title**: "Husein and Fatema's Game Room"
- **Theme**: Romantic blush — background `#fff5f5` with subtle radial glows
- **Fonts**: Playfair Display (headings) + Inter (body) from Google Fonts
- **Colors**: Rose `#c44569` headings, gold `#b8860b` subtitle, warm pastel tag backgrounds
- **Cards**: White with rose-tinted borders and soft shadows, hover scale effect
- Responsive grid: 1 column on mobile, 2 columns on 700px+
- Three game cards:
  1. **💌 Valentines** → `/valentines/` (tag: Story)
  2. **🧩 Photo Tiles** → `/tiles/` (tag: Solo)
  3. **🎲 Ludo** → `/ludo/` (tag: Multiplayer)
- Footer: "Made with ♥ by Husein"

---

## 4. Valentines Game (`public/valentines/`)

### Overview
A love-letter puzzle adventure through 6 levels. Single-player, fully static (no server needed). Player catches floating hearts/objects to progress through memory photos.

### Files
- `index.html` — Self-contained: all HTML, CSS, and JS inline
- `images/level1.jpg` through `level5.jpg`, `final.jpg` — Photos for each level
- `music.mp3` — Background music

### How It Works
- 6 levels, each with a photo reveal
- CONFIG object at top of script defines levels, captions, speeds
- Level 6 has "magnet" behavior (heart drifts toward cursor/finger)
- Touch/mobile optimized

### Customization
Edit the `CONFIG` object in the `<script>` section:
- `CONFIG.levels[].caption` — Caption text per level
- `CONFIG.levels[].speed` — Object movement speed
- `CONFIG.finalLetter` — The letter revealed at the end
- Replace images in `images/` folder

---

## 5. Photo Tiles Game (`public/tiles/`)

### Overview
A pattern-matching tile puzzle (6×5 = 30 tiles). Match tiles by shared visual attributes to clear them. Photos reveal underneath as tiles are cleared. Originally built as "Fatema Tiles" (source: `C:\Users\huseinm\Downloads\fatema-tiles`).

### Files
- `index.html` — HTML structure, PWA meta tags, links to CSS/JS, theme toast element
- `style.css` — Full styling including `.theme-pill` toast overlay
- `app.js` — Main application controller (ES modules, imports engine + renderer + photos)
  - Shows theme name + emoji as a toast on each new game (fades after 2s)
- `engine.js` — Board generation, game logic & **14-theme system** (~370 lines)
  - `THEMES` array defines all 14 themes (palette, patterns, styles, shapes, accents)
  - `buildPools(theme)` — generates 4 attribute pools of 15 items each from a theme
  - `generateBoard()` — picks a random theme, builds pools, creates paired 30-tile board
  - `GameState` class — manages board, matching, scoring; tracks `currentTheme`
  - Exports: `GameState`, `ROWS`, `COLS`, `TILE_COUNT`, `THEMES`
- `renderer.js` — SVG tile rendering with spatial-zone design (~1520 lines)
  - 4 render functions: `renderBg()`, `renderRing()`, `renderShape()`, `renderAccent()`
  - ~252 visual element cases across all 14 themes
  - `viewBox 0 0 100 100` — four spatially distinct zones rendered back-to-front
  - Layer order: bg → ring → accent → shape
- `photos.js` — Loads random photo from `photos/manifest.json`
- `photos/manifest.json` — Array of photo filenames
- `photos/` — 5 personal photos (JPGs with UUID-style names + one dated photo)
- `manifest.json` — PWA manifest (app name: "huseinlovesyou")
- `sw.js` — Service worker for PWA offline capability

### Gameplay
1. Start: 30 randomly generated tiles on a 6×5 grid — theme chosen randomly
2. Theme name + emoji shown briefly as a toast overlay (e.g. "🌙 Celestial")
3. Tap two tiles that share at least one visual attribute to match them
4. Matched tiles disappear, revealing a photo underneath
5. Track combo streaks and clear all 30 tiles to win
6. "✨ New" button starts a fresh board with a new random theme + random photo

### Score Display
- Current combo, best combo, tiles cleared (X/30)

### Theme System

Each new game randomly selects one of **14 visual themes**. Each theme defines:
- **Palette**: 3 bg colors, 5 ring colors, 3 shape colors, 3 accent colors
- **Background patterns** (5): how the tile background is filled
- **Ring styles** (3): the decorative border frame
- **Center shapes** (5): the central icon/symbol
- **Corner accents** (5): small decorations in the 4 corners

**Pool math constraint**: Every attribute pool must produce exactly **15 items** (duplicated to 30 for the board):
- bg: 5 patterns × 3 colors = 15
- ring: 5 ring colors × 3 styles = 15
- shape: 5 shapes × 3 colors = 15
- accent: 5 accents × 3 colors = 15

#### Theme 1: Azulejo 🎨 (original)
- **Vibe**: Portuguese ceramic tiles
- **Palette**: bg `#66BB6A, #F06292, #FFB300` / ring `#2E7D32, #C2185B, #1565C0, #6A1B9A, #E65100` / shape `#43A047, #E91E63, #1E88E5` / accent `#FF6D00, #00ACC1, #AB47BC`
- **Bg patterns**: checkerboard, diagonal, hBars, vBars, solid
- **Ring styles**: solid, dashed, double
- **Shapes**: cross, flower, star, diamond, clover
- **Accents**: circles, diamonds, squares, triangles, dots

#### Theme 2: Celestial 🌙
- **Vibe**: Night sky, cosmic
- **Palette**: bg `#1a237e, #4a148c, #ff8f00` / ring `#90a4ae, #ffab00, #00e5ff, #e040fb, #ff6e40` / shape `#00e5ff, #e040fb, #ffab00` / accent `#b0bec5, #00e5ff, #ffd740`
- **Bg patterns**: starfield, nebula, aurora, cosmic-dust, void
- **Ring styles**: glow, dotted, eclipse
- **Shapes**: crescent, starburst, hexagon, saturn, eye
- **Accents**: tiny-stars, sparks, orbs, carets, moons

#### Theme 3: Garden 🌿
- **Vibe**: Botanical, floral
- **Palette**: bg `#4caf50, #ba68c8, #fbc02d` / ring `#2e7d32, #7b1fa2, #ef6c00, #00838f, #c62828` / shape `#43a047, #ab47bc, #ff7043` / accent `#ff6f00, #00897b, #d81b60`
- **Bg patterns**: polkadots, stripes, crosshatch, petals, meadow
- **Ring styles**: vine, thorn, ribbon
- **Shapes**: heart, tulip, leaf, raindrop, sun
- **Accents**: seeds, dewdrops, buds, rosettes, thorns

#### Theme 4: Deco ✨
- **Vibe**: Art Deco geometric
- **Palette**: bg `#ffb300, #4db6ac, #e57373` / ring `#bf360c, #1b5e20, #4a148c, #01579b, #e65100` / shape `#d84315, #1b5e20, #283593` / accent `#ff6f00, #2e7d32, #6a1b9a`
- **Bg patterns**: fan, sunray, chevron, scales, zigzag
- **Ring styles**: thick-thin, dotted-line, fillet
- **Shapes**: arch, bowtie, pentagon, keystone, fan-shape
- **Accents**: rays, studs, arrows, wings, bolts

#### Theme 5: Mosaic 🏺
- **Vibe**: Terracotta tessellation
- **Palette**: bg `#8d6e63, #4db6ac, #ffb74d` / ring `#d84315, #00695c, #f9a825, #283593, #558b2f` / shape `#bf360c, #00897b, #f57f17` / accent `#e65100, #00838f, #827717`
- **Bg patterns**: triangles, hexgrid, brickwork, pinwheel, terrazzo
- **Ring styles**: rope, notched, inset
- **Shapes**: octagon, arrow-shape, hourglass, shield, spiral
- **Accents**: plus-signs, arrowheads, wedges, pips, nails

#### Theme 6: Candy 🍬
- **Vibe**: Sweet shop, playful
- **Palette**: bg `#f06292, #81c784, #ffcc80` / ring `#c2185b, #00897b, #ff6f00, #6a1b9a, #1565c0` / shape `#e91e63, #00bfa5, #ff9100` / accent `#d81b60, #00acc1, #ff6d00`
- **Bg patterns**: sprinkles, swirl, wafer, gingham, frosted
- **Ring styles**: frosting, licorice, candy-dots
- **Shapes**: lollipop, gumdrop, pretzel, donut, bonbon
- **Accents**: mini-sprinkles, cherries, drops, gumballs, mini-hearts

#### Theme 7: Noir 🖤
- **Vibe**: Film noir, monochrome
- **Palette**: bg `#111111, #333333, #666666` / ring `#ffffff, #cccccc, #888888, #555555, #aaaaaa` / shape `#ffffff, #999999, #444444` / accent `#eeeeee, #888888, #333333`
- **Bg patterns**: halftone, film-grain, scanlines, gradient-fade, ink-blot
- **Ring styles**: sharp, etched, shadow
- **Shapes**: spade, crown, bolt-shape, mask, key
- **Accents**: crosshairs, slashes, corners, pins, xs

#### Theme 8: Sepia 📜
- **Vibe**: Vintage parchment, antique
- **Palette**: bg `#d4c4a8, #c0a080, #a07850` / ring `#3e2723, #6b4423, #8b6914, #a0522d, #5c3a1e` / shape `#3e2723, #8b6914, #c49a6c` / accent `#5c3a1e, #a0522d, #d4a574`
- **Bg patterns**: parchment, woodgrain, linen, coffee-stain, aged-paper
- **Ring styles**: ornate, worn, gilded
- **Shapes**: quill, compass, anchor, fleur, lantern
- **Accents**: filigree, rivets, scrolls, stamps, ink-dots

#### Theme 9: Neon 💡
- **Vibe**: Cyberpunk, electric glow
- **Palette**: bg `#0d0221, #1a0533, #2b0845` / ring `#ff00ff, #00ffff, #ff3366, #39ff14, #ffff00` / shape `#ff00ff, #00ffff, #39ff14` / accent `#ff3366, #ffff00, #00ffff`
- **Bg patterns**: grid-lines, circuit, pixel-blocks, laser-beams, digital-rain
- **Ring styles**: neon-glow, pulse, wireframe
- **Shapes**: lightning, pixel-heart, pac-ghost, controller, gem
- **Accents**: glitch-dots, brackets, pixels, signal-bars, power-icons

#### Theme 10: Tropical 🌴
- **Vibe**: Island paradise, vibrant nature
- **Palette**: bg `#00bcd4, #ff7043, #ffca28` / ring `#e91e63, #4caf50, #ff9800, #2196f3, #9c27b0` / shape `#e91e63, #4caf50, #ff9800` / accent `#f44336, #00bcd4, #ffeb3b`
- **Bg patterns**: waves, palm-fronds, sand-ripples, bamboo, sunset-gradient
- **Ring styles**: lei, rope-twist, shell-border
- **Shapes**: flamingo, pineapple, hibiscus, surfboard, starfish
- **Accents**: coconuts, fish, waves-mini, shells, sun-rays

#### Theme 11: Indian 🪷
- **Vibe**: Traditional Indian motifs, rich heritage
- **Palette**: bg `#ff9933, #138808, #4a0082` / ring `#d4af37, #b22222, #ff6f00, #1a5276, #8b0000` / shape `#d4af37, #b22222, #138808` / accent `#ff9933, #d4af37, #e91e63`
- **Bg patterns**: rangoli, paisley, mehndi-swirls, block-print, jali-lattice
- **Ring styles**: zari-border, kolam, thread-wrap
- **Shapes**: diya, lotus, elephant, peacock, mango-paisley
- **Accents**: bindis, bells, bangles, om-dots, marigolds

#### Theme 12: Bollywood 🎬
- **Vibe**: Glamorous cinema, sequins and spotlights
- **Palette**: bg `#e91e63, #ffd700, #6a1b9a` / ring `#ff4081, #ffc107, #00bcd4, #e040fb, #ff5722` / shape `#ff4081, #ffd700, #00bcd4` / accent `#e040fb, #ff5722, #ffc107`
- **Bg patterns**: spotlight, sequins, film-strip, curtain-drapes, disco-floor
- **Ring styles**: marquee-lights, bollywood-arch, sequin-border
- **Shapes**: filmi-star, filmi-heart, microphone, clapperboard, dancing-figure
- **Accents**: music-notes, sparkles, cameras, roses, masala-stars

#### Theme 13: Arithmetic 🔢
- **Vibe**: Chalkboard math, classroom nostalgia
- **Palette**: bg `#2e7d32, #1b5e20, #004d40` / ring `#ffffff, #ffeb3b, #ff7043, #42a5f5, #ef5350` / shape `#ffffff, #ffeb3b, #42a5f5` / accent `#ff7043, #ef5350, #ffffff`
- **Bg patterns**: graph-paper, chalkboard, notebook-lines, dot-grid, equation-scribbles
- **Ring styles**: ruler-marks, protractor, bracket-border
- **Shapes**: plus-sign, divide-symbol, pi-symbol, infinity, abacus
- **Accents**: equal-signs, percent, tally-marks, decimal-dots, hash-marks

#### Theme 14: Sky 🌈
- **Vibe**: Daytime sky, clouds and rainbows
- **Palette**: bg `#64b5f6, #90caf9, #fff176` / ring `#e53935, #ff9800, #4caf50, #7b1fa2, #1565c0` / shape `#e53935, #ff9800, #1565c0` / accent `#4caf50, #f48fb1, #ffb300`
- **Bg patterns**: sky-gradient, fluffy-clouds, rainbow-arc, cirrus-wisps, sunset-glow
- **Ring styles**: cloud-border, rainbow-ring, breeze-dash
- **Shapes**: airplane, songbird, bright-sun, kite, hot-air-balloon
- **Accents**: tiny-birds, butterflies, raindrops, drifting-leaves, contrails

### Renderer Architecture

Each tile is an SVG `viewBox 0 0 100 100` with 4 layered zones (back-to-front):
1. **Background** (full tile, 4-96 inset) — `renderBg(attr)` — 70 pattern cases (14 themes × 5)
2. **Ring** (border frame) — `renderRing(attr)` — 42 style cases (14 × 3)
3. **Accent** (4 corners at `[[16,16],[84,16],[16,84],[84,84]]`) — `renderAccent(attr)` — 70 accent cases (14 × 5)
4. **Shape** (center, ~28-72 extent) — `renderShape(attr)` — 70 shape cases (14 × 5)

All rendering is dispatch-on-string via `switch` statements. Adding a new theme requires:
1. Define the theme object in the `THEMES` array in `engine.js`
2. Add `case` entries for each new pattern/style/shape/accent in `renderer.js`

### Adding a New Theme
1. In `engine.js`, add a new object to the `THEMES` array:
   ```javascript
   { name: 'NewTheme', emoji: '🔥',
     palette: { bg: [3 colors], ring: [5 colors], shape: [3 colors], accent: [3 colors] },
     bgPatterns: [5 strings], ringStyles: [3 strings], shapeNames: [5 strings], accentShapes: [5 strings] }
   ```
2. In `renderer.js`, add matching `case` entries in all 4 render functions
3. Verify pool math: 5×3=15 for bg, ring, shape, accent

---

## 6. Ludo Game — Detailed Reference

### Overview
Classic Ludo board game, 2-4 players, real-time multiplayer via Socket.IO. Mobile-optimized with Canvas rendering, sound effects, haptic feedback, spectator mode, and exit/end game controls.

### Visual Theme
- **Romantic blush** — background `#fff5f5`, white cards with rose-tinted borders
- **Fonts**: Playfair Display (heading) + Inter (body), matching the landing page
- **Player colors** — standard RGBY (reverted from romantic Rose/Gold/Teal/Indigo theme):
  | Key | Fill | Light (base/path) | Dark (borders) |
  |-----|------|-------------------|----------------|
  | red | `#D32F2F` | `#FFCDD2` | `#B71C1C` |
  | green | `#388E3C` | `#C8E6C9` | `#1B5E20` |
  | yellow | `#F9A825` | `#FFF9C4` | `#F57F17` |
  | blue | `#1976D2` | `#BBDEFB` | `#0D47A1` |
- Center HOME triangles use `COLORS[x].fill` dynamically — auto-updates with color changes
- Capture banner background uses `COLORS[capturer].fill`
- **Design note on color choices**: These are Material Design primary colors chosen for maximum distinguishability on both OLED and LCD screens. The romantic theme colors (Rose/Gold/Teal/Indigo) were visually appealing but Gold and Teal were hard to distinguish on some mobile screens, and the "display name" abstraction (red key -> "Rose" label) created confusion when the base color didn't match the token color. Standard RGBY removes that mismatch entirely — the COLORS object key IS the color you see.

### Client: `public/ludo/index.html` (915 lines)

Single file containing all HTML, CSS, and JavaScript.

#### Screens (CSS class `.screen`, toggled via `.active`)
1. **`screen-idle`** — No game running. Shows "Create Game" button with name input.
2. **`screen-lobby`** — Game created, waiting for players. Shows player list with color dots, join form, and start button (creator only, 2+ players required).
3. **`screen-playing`** — Active game. Canvas board, dice button, turn indicator, pick/no-move hints, capture banner, exit/end game buttons. Debug panel exists in HTML but is hidden (activation code commented out).
4. **`screen-finished`** — Game over. Shows final board state, winner message, and "New Game" button.

#### Board Geometry (15×15 grid, Canvas)
- Common path: 52 cells, `PATH[0]` = (13,6), goes clockwise
- Color start offsets: Red=0, Green=13, Yellow=26, Blue=39
- Home stretches: 5 cells each leading to center (7,7) — 6 cells including entry
- Safe squares (star markers): indices 0, 8, 13, 21, 26, 34, 39, 47
- Token steps: 0=base, 1-51=common path, 52-56=home stretch, 57=finished
- Base positions (4 tokens per color in home quadrant):
  - Red: rows 9-12, cols 0-5 area
  - Green: rows 0-5, cols 0-5 area
  - Yellow: rows 0-5, cols 9-14 area
  - Blue: rows 9-12, cols 9-14 area

#### Token Rendering
- Global position grouping across ALL colors (not per-color) — prevents overlap
- Tokens at same position fan out: offset by index, scaled down when stacked
- Movable tokens get a pulsing golden glow highlight
- Finished tokens (step 57) shown in center HOME area

#### Sound Effects (Web Audio API, no external files)
- `sfxRoll()` — Dice roll sound (noise burst)
- `sfxMove()` — Token move (short beep)
- `sfxLeaveBase()` — Token leaves base (ascending tone)
- `sfxCapture()` — Capture (descending sawtooth)
- `sfxYourTurn()` — Your turn notification (gentle chime)
- `sfxWin()` — Win fanfare (ascending arpeggio)
- Sound toggle button (🔊/🔇) persisted in `localStorage` key `ludo_sound`
- AudioContext created lazily, resumed if suspended (mobile autoplay policy)

#### Haptic Feedback
- `hapticLight()` — 10ms vibration (dice roll, token move)
- `hapticMedium()` — 30ms (leave base)
- `hapticHeavy()` — [50, 30, 100] pattern (capture)
- Via `navigator.vibrate()` — works on Android, limited iOS support

#### Socket.IO Connection
- Connects to `/ludo` namespace: `io('/ludo')`
- Session persistence: `mySessionId` stored in JS variable (not localStorage)
- On reconnect (`socket.on('connect')`): auto-sends `rejoin` with sessionId
- `visibilitychange` listener: forces reconnect when tab becomes visible again

#### Debug Panel
- HTML and JS code preserved but **disabled** in production
- Activation code (5 rapid taps on dice area) is commented out in the JS
- To re-enable: uncomment the `debugTapCount` / `addEventListener` block (~line 818)
- Force dice value buttons (1-6) — only works on your turn
- Sends `debug_roll` event to server

#### Exit & End Game Controls
- **🚪 Exit Game** — visible to all players during gameplay
  - Removes the player from the game (tokens deleted, player array spliced)
  - If only 1 player remains, they win by default
  - Adjusts `currentPlayerIndex` correctly if exiting player was mid-turn
  - Requires confirmation dialog
- **⛔ End Game** — visible only to the game creator (players[0])
  - Force-ends the game for everyone, resets to idle
  - Server validates that only `players[0].sessionId` can trigger this
  - Requires confirmation dialog

### Server: Ludo section of `server.js` (lines 14-583)

#### Constants
```javascript
COLORS = ['red', 'green', 'yellow', 'blue']
IDLE_TIMEOUT = 30 * 60 * 1000      // 30 minutes — no turns taken
TURN_SKIP_DELAY = 1500              // 1.5s pause before auto-skipping (no valid moves)
DISCONNECT_GRACE = 15 * 60 * 1000   // 15 minutes — socket drop grace period
AUTO_PLAY_DELAY = 60 * 1000         // 1 minute — auto-play idle player's turn
```

#### Game State Object (`game`)
```javascript
{
  phase: 'lobby' | 'playing' | 'finished',
  players: [{
    sessionId: string (UUID),
    name: string,
    color: 'red' | 'green' | 'yellow' | 'blue',
    connected: boolean,
    socketId: string,
    disconnectTimer: timeout | null
  }],
  currentPlayerIndex: number,
  diceValue: number | null,
  diceRolled: boolean,
  tokens: { red: [0,0,0,0], green: [0,0,0,0], ... },  // step values per token
  winner: string | null,  // color name, 'idle', or 'disconnect'
  lastCapture: { by, victim, tokenIdx, pathIdx } | null,
  idleTimer: timeout,
  turnTimer: timeout,
  autoPlayTimer: timeout
}
```

#### Socket Events (server ↔ client)

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `rejoin` | `sessionId` | Reconnect to existing game |
| `create` | `{ name }` | Create new game (becomes lobby host) |
| `join` | `{ name }` | Join existing lobby |
| `start` | `sessionId` | Start game (host only, 2+ players) |
| `roll` | `sessionId` | Roll dice (current player only) |
| `move` | `{ sessionId, tokenIndex }` | Move a token (current player only) |
| `debug_roll` | `{ sessionId, value }` | Force dice value (debug) |
| `exit_game` | `sessionId` | Player leaves mid-game |
| `end_game` | `sessionId` | Creator force-ends game |
| `reset` | (none) | Force reset game |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `state` | full game state object | Broadcast after every change |
| `session` | `sessionId` | Sent once on create/join |
| `error_msg` | `string` | Error message |

#### Game Flow
1. **Idle** → Someone creates a game → **Lobby**
2. **Lobby** → Players join (2-4). Creator clicks Start → **Playing**
3. **Playing** → Players take turns rolling dice and moving tokens
4. **Finished** → Someone gets all 4 tokens to step 57, or timeout/disconnect
5. Auto-reset to **Idle** after 30 seconds (10s for idle timeout)

#### Dice Roll Boost
- When all 4 of a player's tokens are in base (step 0): ~33% chance of rolling 6
- Normal: uniform random 1-6
- Re-evaluates each roll dynamically

#### Turn Logic (`nextTurn()`)
1. Clear turnTimer and autoPlayTimer
2. Reset idle timer
3. Clear dice state
4. Advance to next connected player (skip disconnected)
5. If no connected players → game over
6. Broadcast state
7. **Clear `game.lastCapture = null`** (after broadcast — ensures exactly-once delivery)
8. Start 60-second auto-play timer

#### Auto-Play Timer (`startAutoPlayTimer()`)
- Single 60-second timer covers the ENTIRE turn (roll + token pick)
- If player hasn't rolled: auto-roll + auto-move (random valid token)
- If player rolled but hasn't picked: auto-pick random valid token
- Timer starts at turn begin, does NOT reset on roll (one deadline for whole turn)
- Cleared only when player completes their move (via `move` handler)

#### Post-Roll Logic (after dice roll)
- **0 movable tokens**: Show dice, auto-skip turn after 1.5s
- **1 movable token**: Show dice for 1s, then auto-move that token
- **2+ movable tokens**: Show dice, wait for player to tap a token (auto-play timer still ticking)

#### Extra Turn Rules
- Rolling a 6 → extra turn
- Capturing an opponent → extra turn
- **Token reaching home (step 57) → extra turn**
- Extra turn means the same player rolls again immediately (no turn advancement)
- All three conditions are checked at every code path where a move completes (5 locations — see design note below)
- Win check runs BEFORE extra turn check, so if the last token reaches home, the game ends rather than granting a useless extra turn

**Design note — why 5 locations**: The extra turn condition (`value === 6 || captured || reachedHome`) appears in 5 separate places in server.js because there are 5 distinct code paths that complete a move: (1) roll handler auto-move (single valid token), (2) move handler (player picks token), (3) auto-play roll+move, (4) auto-play pick-only, (5) debug_roll auto-move. Each has its own variable context (different variable names for the token index). A future refactor could extract a shared `completeMove()` function, but the current approach is explicit and grep-able — search for `reachedHome` to find all 5. If you add a new code path that moves tokens, you MUST add the reachedHome check there too.

#### Capture Mechanics
- Landing on opponent's token on the common path sends them back to base (step 0)
- Safe squares are immune to capture (indices 0, 8, 13, 21, 26, 34, 39, 47)
- Home stretch is immune (steps 52-57)
- `lastCapture` stored in game state for client banner display

#### Disconnect Handling
- Socket disconnect → 15-minute grace period starts
- If player reconnects within grace → timer cleared, game continues
- If grace expires:
  - Player marked `connected: false`
  - If ≤1 connected player → game over (last player standing wins)
  - If disconnected player was current → advance turn
- `visibilitychange` on client auto-reconnects when tab becomes visible

#### Spectator Mode
- Non-players connecting during an active game see the live board
- Turn indicator shows "👀 Spectating — [name]'s turn"
- Dice area and control hints hidden
- Capture banners still visible
- Can join the next game after reset

#### Capture Banner
- Shows "💥 [attacker] captured [victim]!" with attacker's color background
- Auto-hides after 3 seconds (client-side timer)
- **Server clears `game.lastCapture = null` immediately after `broadcastState()` in `nextTurn()`** — this ensures the capture info is broadcast exactly once, then all subsequent state broadcasts have `lastCapture: null`
- Client checks `state.lastCapture` on every state update: non-null shows banner, null hides it

**Design note — why clear AFTER broadcast, not before**: The banner data must survive in game state long enough to be included in one `broadcastState()` call so all clients see it. Clearing it before broadcast would mean no client ever sees it. Clearing it after ensures exactly-once delivery. The previous bug was that `lastCapture` was NEVER cleared — it persisted forever, causing every subsequent broadcast (dice rolls, moves, turn changes) to re-trigger the banner on all clients.

**Design note — why not clear on client side only**: A client-side-only fix (e.g. tracking "already shown this capture") was considered but rejected. The server is the source of truth — if the server keeps sending stale data, every new client connection (spectators, reconnects) would also see the ghost banner. Fixing at the source is cleaner.

#### Logging
- All server events logged with `[LUDO HH:MM:SS.mmm]` prefix
- Key events: CONNECT, DISCONNECT, REJOIN, CREATE, JOIN, START, ROLL, MOVE, CAPTURE, AUTO-PLAY, GAME OVER, GRACE EXPIRED

---

## 7. Known Issues & Limitations

1. **In-memory game state**: Render process restart loses the game. No persistence layer. Free tier can restart anytime (though Socket.IO heartbeats prevent idle shutdown while connected).

2. **Single game at a time**: Only one Ludo game can run globally. By design — "not very sophisticated, just have one game running at any point."

3. **No authentication**: Players identified by UUID sessionId stored in localStorage (`ludo_session`). Refreshing reloads sessionId from localStorage; `visibilitychange` handles tab suspension.

4. **Winner display shows player name**: If a player names themselves "2", it shows "2 wins!" — this is correct behavior, not a bug.

5. **GoDaddy DNS not configured**: huseinlovesyou.com still points to Netlify.

---

## 7b. Ludo Architecture — Design Pitfalls & Patterns

This section documents recurring design patterns, past mistakes, and the reasoning behind current approaches. Read this BEFORE making Ludo changes to avoid re-introducing fixed bugs.

### The "5 Code Paths" Problem

Token movement can complete through 5 distinct code paths in server.js:

| # | Path | Location | Token Variable | When It Runs |
|---|------|----------|---------------|-------------|
| 1 | Roll handler auto-move | `socket.on('roll')` | `movable[0]` | Player rolls, only 1 token can move → auto-moved after 1s delay |
| 2 | Move handler | `socket.on('move')` | `tokenIdx` | Player manually picks a token |
| 3 | Auto-play roll+move | `startAutoPlayTimer()` first branch | `pick` | 60s timeout, player hasn't rolled yet |
| 4 | Auto-play pick-only | `startAutoPlayTimer()` second branch | `pick` | 60s timeout, player rolled but hasn't picked |
| 5 | Debug roll auto-move | `socket.on('debug_roll')` | `movable[0]` | Debug panel forced dice value, single valid token |

**Rule**: Any logic that runs after a move completes (extra turn, win check, capture handling) MUST be duplicated across all 5 paths. If you add something to one path, grep for the others and add it there too. Search for `reachedHome` to find the current pattern.

**Why not extract a shared function?** Each path has different surrounding context (timers, delays, broadcast timing). A shared `completeMove()` would need many parameters and conditionals, making it harder to read than the current explicit approach. The tradeoff is accepted: duplication is the cost of readability. If a 6th path is ever added, consider refactoring.

### State Lifecycle — When to Clear Transient Fields

The `game` object holds both persistent state (tokens, players, phase) and transient state (lastCapture, diceValue). Transient fields that trigger client UI effects MUST be cleared after exactly one broadcast:

| Field | Set By | Cleared By | If Not Cleared |
|-------|--------|-----------|----------------|
| `lastCapture` | `checkCapture()` | `nextTurn()` after `broadcastState()` | Banner re-appears on every broadcast forever |
| `diceValue` | Roll handler | `nextTurn()` before broadcast | Previous dice shows on next player's turn |
| `diceRolled` | Roll handler | `nextTurn()` before broadcast | Next player can't roll |

**Pattern**: Clear transient UI-trigger fields AFTER `broadcastState()` if clients need to see them once, or BEFORE if clients should never see stale values. `lastCapture` is the "after" pattern (show once then clear). `diceValue/diceRolled` is the "before" pattern (clean slate for next turn).

### Color System — The COLORS Object is the Single Source of Truth

All visual color references in both client and server flow through the `COLORS` object in `public/ludo/index.html`. The keys (`red`, `green`, `yellow`, `blue`) match the server's `COLORS` array and player `.color` field.

**What NOT to do:**
- Don't hardcode hex values in drawing functions — always reference `COLORS[x].fill/light/dark`
- Don't add a "display name" abstraction (e.g., mapping "red" → "Rose") — this was tried and caused confusion when base colors didn't match token colors
- Don't use colors that are too similar (Rose and Plum were nearly indistinguishable on some screens)

**What TO do:**
- Use Material Design primary colors or similar well-tested palettes
- Ensure the `light` variant is a near-white pastel (for base/path fill) — it should be obviously lighter than `fill`
- Ensure the `dark` variant is deeply saturated (for borders) — it should be obviously darker than `fill`
- Test on both OLED and LCD screens if possible — some color pairs look distinct on one but not the other

### Caching — Mobile Browsers Are Aggressive

`express.static` serves files with default ETags but no explicit Cache-Control header. Mobile browsers (especially iOS Safari) interpret this as "cache indefinitely" and may serve stale HTML for days.

**Solution**: Middleware before `express.static` sets `Cache-Control: no-cache` on HTML and directory requests. This doesn't disable caching — it forces revalidation. The browser sends an `If-None-Match` header, server responds 304 (Not Modified, no body) if unchanged. Overhead is ~200-500 bytes per page load.

**What NOT to do:**
- Don't use `no-store` — that disables caching entirely, forcing full re-download every time
- Don't set `max-age: 0` alone — some browsers treat this differently from `no-cache`
- Don't add cache-busting query strings to Socket.IO URLs — the library handles its own versioning
- Don't apply `no-cache` to images/CSS/JS unless they change frequently — those are fine to cache

### broadcastState() — The Central Sync Mechanism

Every game state change MUST go through `broadcastState()` to reach all clients. Common mistakes:

1. **Mutating state AFTER broadcast but expecting clients to see it**: If you change `game.foo` after `broadcastState()`, clients won't see it until the next broadcast. This is sometimes intentional (lastCapture clearing) but must be deliberate.

2. **Forgetting to broadcast**: If you change game state but don't call `broadcastState()` or `nextTurn()` (which calls it internally), clients will be out of sync until the next action triggers a broadcast.

3. **Broadcasting too often**: Each `broadcastState()` sends the full game state to all connected clients. Don't call it in a tight loop. The current architecture calls it at natural break points: after roll, after move, after turn change.

---

## 8. Common Tasks

### Run locally
```bash
cd C:\Users\huseinm\Downloads\husein-games
npm install   # first time only
node server.js
# Opens at http://localhost:3000
# Network URL shown in console for mobile testing on same WiFi
```

### Push changes to production
```bash
cd C:\Users\huseinm\Downloads\husein-games
git add -A
git commit -m "description of changes"
git push
# Render auto-deploys within ~1-2 minutes
```

### Check Render logs
Go to https://dashboard.render.com → husein-games service → Logs tab.
Server logs are prefixed with `[LUDO timestamp]`.

### Add a new game
1. Create folder under `public/` (e.g., `public/newgame/`)
2. Add `index.html` and assets
3. Add a card to `public/index.html` in the `.games` grid
4. If it needs server-side logic, add a new Socket.IO namespace in `server.js`
5. Push to deploy

### Change Ludo timers
All constants are at the top of `server.js` (lines 20-23):
```javascript
const IDLE_TIMEOUT = 30 * 60 * 1000;      // Game ends if no turns for 30 min
const TURN_SKIP_DELAY = 1500;              // Pause before auto-skipping unmovable turn
const DISCONNECT_GRACE = 15 * 60 * 1000;   // Grace period for socket drops
const AUTO_PLAY_DELAY = 60 * 1000;         // Auto-play idle player's turn
```

---

## 9. Original Source Locations

| Game | Original Location | Notes |
|------|-------------------|-------|
| Valentines | `C:\Users\huseinm\OneDrive - Microsoft\Documents\ValenineSite` | Copied to public/valentines/ |
| Photo Tiles | `C:\Users\huseinm\Downloads\fatema-tiles` | Copied to public/tiles/ |
| Ludo | `C:\Users\huseinm\ludo-game\` | Original standalone version (may still exist). Portal version modified for /ludo namespace. |

---

## 10. Future Ideas — Photo Tiles Theme Expansion

### Vision
The game now has 14 diverse themes spanning colorful playful styles (Candy, Tropical, Bollywood) to sophisticated restrained palettes (Noir, Sepia, Arithmetic). Future expansion should explore two directions: (1) **Pattern Mode** — a fundamentally different engine mode for monochrome themes, and (2) **structural redesigns** that change what the 4 tile dimensions represent.

### Two Engine Modes

The current engine uses **Color Mode**: `5 patterns x 3 colors = 15` per dimension. This works great for colorful themes but limits monochrome designs (repeating the same color makes tiles visually identical but with different IDs, breaking solvability).

A new **Pattern Mode** would use: `15 unique patterns x 1 color = 15` per dimension. All differentiation comes from shapes, line work, and geometric complexity — not color.

`buildPools()` would need a `monochrome: true` flag (or similar) to switch between the two generation strategies.

### Inspiration & Aesthetic References

| Style | Description | Color Palette |
|-------|------------|---------------|
| **Moorish/Moroccan** | Compass stars, diamond frames, geometric interlocking | Black + gold on white |
| **Portuguese Azulejo (v2)** | Intricate line art tiles, floral & geometric | Blue on white (monochrome rework of current Azulejo) |
| **Noir (v2)** | Intricate line art, stipple, crosshatch in Pattern Mode | White on black |
| **Sepia (v2)** | Vintage engraving style, ornate frames in Pattern Mode | Brown on parchment |

Key aesthetic principles observed from reference images:
- Rich geometric complexity within each tile
- Restrained color palette (1-3 colors max)
- Pattern variety does all the heavy lifting
- Tile-like / architectural / artisan feel

### Other Theme Directions to Explore

**Structural redesigns** (change what the 4 dimensions ARE):
- **Nested Squares** (Albers-style) — outer/middle/inner square color + border style
- **Concentric Circles** (pop-art) — ring colors at 3 depths + outline style
- **Quadrant Tiles** — 4 colored quadrants, each is a dimension

**Thematic skins** (same mechanics, different feel):
- **Emoji Tiles** — use emoji as the shape dimension
- **Seasonal** — cherry blossoms, snowflakes, autumn leaves as shapes

### Implementation Effort for Pattern Mode

Per pattern-mode theme, requires:
- **15 unique backgrounds** (full-tile patterns)
- **15 unique ring styles** (border treatments)
- **15 unique center shapes** (geometric motifs)
- **15 unique corner accents** (decorative details)
- Total: **~60 new SVG rendering cases per theme**

Engine changes:
1. Add `monochrome: true` flag to theme definitions
2. Modify `buildPools()` to handle 15x1 pool generation
3. Each pattern-mode theme needs 15 entries per dimension array (instead of 5+3)

This is a significant but worthwhile effort — the result would be visually stunning and truly set the game apart.

---

## 11. Key Bug Fixes History

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Game ends randomly mid-play | Aggressive 15s disconnect grace — mobile suspends sockets | Increased to 15 min + added visibilitychange auto-reconnect |
| "Not Found" on subgame pages (Render) | `express.static('public')` — relative path fails on Render | Changed to `path.join(__dirname, 'public')` |
| Tokens won't leave base after rolling 6 | Client sends `tokenIndex`, server expected `tokenIdx` | Destructuring rename in move handler |
| Auto-move too fast, no dice feedback | Single token auto-moved instantly | Added 1s delay: broadcast state first, then auto-move |
| Capture banner stays forever | `lastCapture` never cleared server-side | Client auto-hides banner after 3 seconds |
| Cross-color token overlap on board | Position grouping was per-color | Changed to global position grouping across all colors |
| Pink and purple too similar | Plum `#7b2d8e` too close to Rose `#c44569` | Changed 4th color to Indigo `#3355a0` |
| Home center triangles old colors | Hardcoded `#D32F2F` etc in drawCenter() | Updated to use `COLORS[x].fill` dynamically |
| Light/dark variants indistinguishable | Light/dark hex values too close to fill | Widened gap: lights are near-white pastels, darks are deep saturated |
| **Home/base color mismatch** | Romantic theme colors (Rose/Gold/Teal/Indigo) created mismatch — key says "red" but token looks pink. Display name abstraction added confusion. | **Reverted to standard RGBY** (Material Design primaries). Eliminated the display name layer entirely — what the code calls "red" now IS red. |
| **No extra turn on reaching home** | Extra turn only granted for rolling 6 or capturing. Token reaching home (step 57) gave no reward. | Added `reachedHome` check at all 5 move-completion code paths. Pattern: `const reachedHome = game.tokens[color][tokenIdx] === 57;` appended to existing extra-turn condition. |
| **Capture banner keeps reappearing** | `game.lastCapture` set on capture but NEVER cleared. Every `broadcastState()` re-sent stale capture data, re-triggering the client banner in an infinite show/hide loop. | Added `game.lastCapture = null;` immediately after `broadcastState()` in `nextTurn()`. Ensures exactly-once delivery: banner data included in one broadcast, then gone. |
| **Mobile serves stale cached HTML after deploy** | `express.static` serves HTML with default caching headers. Mobile browsers (esp. iOS Safari) aggressively cache and don't revalidate. | Added middleware BEFORE `express.static` that sets `Cache-Control: no-cache` on `.html` files and directory paths. Browser still caches but must revalidate via ETag/304 — negligible overhead (~200-500 byte round-trip), guarantees new deploys are picked up. |
| Tiles blank after Neon/Tropical theme add | Sub-agent placed `default: return '';` but deleted the closing `}` of the switch + function in `renderBg` and `renderRing` — brace count coincidentally balanced | Re-added missing closing braces; added structural validation to catch this |
| Indian/Bollywood/Arithmetic themes blank tiles | `mulberry32()` PRNG called by 5 patterns (paisley, sequins, disco-floor, chalkboard, sequin-border) but never defined in renderer.js — `ReferenceError` crashed tile rendering | Added `mulberry32` function definition at top of renderer.js |
| Bollywood star shape never renders | Duplicate `case 'star'` in renderShape — Azulejo's 8-pointed star (earlier in file) always matched first, Bollywood's was unreachable | Renamed Bollywood's to `case 'filmi-star'` in both engine.js and renderer.js |
| Noir/Sepia game unsolvable | Palette had identical repeated colors (e.g. 3x `#212121`) — tiles visually identical but different IDs | Changed to distinct shades within same hue family |
| **7 themes washed-out / invisible bg** | Light/pastel bg palette colors (lightness 75-95%) rendered at `o=0.6` opacity over the white tile base (`rgba(255,255,255,0.88)` in style.css). Many bg patterns further reduced opacity with multipliers like `o*0.3`. Combined effect: bg colors nearly invisible. Arithmetic & Sky were unaffected because they hardcode solid rect fills at 0.82-0.88 opacity instead of using the shared `o` variable. | Two-pronged fix: (1) Bumped renderer base bg opacity from `0.6` to `0.75` (renderer.js line 18). (2) Darkened bg palette colors for Azulejo, Garden, Deco, Mosaic, Candy, Sepia, Tropical — shifting lightest hex values down 1-2 steps on the Material Design scale. All proposed colors cross-checked against shape/ring/accent palettes to avoid same-color collisions that would break tile solvability. |

---

## 12. Standard Process for Adding New Themes

### Why This Process Exists

When adding 5 themes in a single session, we hit **4 distinct bug classes** that all shipped to production:

| # | Bug Class | What Happened | Why It Wasn't Caught |
|---|-----------|--------------|---------------------|
| 1 | **Missing closing braces** | Sub-agent added switch cases but ate the `}` closing the function | Brace count across the whole file coincidentally balanced |
| 2 | **Undefined function dependency** | 5 patterns called `mulberry32()` (seeded PRNG) which didn't exist in the file | No runtime test — only syntax checks were done |
| 3 | **Duplicate switch case labels** | Two themes used `case 'star'` — JS silently uses only the first match | No cross-theme uniqueness check |
| 4 | **Identical palette colors** | Repeated same hex in palette makes tiles visually indistinguishable → unsolvable | No color distinctness check |

**Root cause**: We had no automated validation. Each bug was only discovered when a user tested the live site. The validator script (`validate-themes.js`) now catches all 4 classes before code is committed.

### Theme Architecture Quick Reference

```
engine.js (THEMES array)          renderer.js (SVG rendering)
─────────────────────────         ──────────────────────────
Theme {                           renderBg(attr)     → case per bgPattern
  name, emoji,                    renderRing(attr)   → case per ringStyle
  palette: {                      renderShape(attr)  → case per shapeName
    bg: [3 colors],               renderAccent(attr) → case per accentShape
    ring: [5 colors],
    shape: [3 colors],            Each case returns an SVG string.
    accent: [3 colors],           Pattern names in engine.js MUST have
  },                              a matching case in renderer.js.
  bgPatterns: [5],
  ringStyles: [3],                Helper functions (e.g. mulberry32 PRNG)
  shapeNames: [5],                must be defined BEFORE any case that
  accentShapes: [5],              calls them.
}
```

**Pool math**: Each dimension generates `patterns × colors = 15` items (duplicated to 30 for matching pairs). This is non-negotiable — the game requires exactly 15 per pool.

### Step-by-Step Checklist

#### Step 1: Define the Theme Object (engine.js)

Add a new entry to the `THEMES` array:

```javascript
{
  name: 'MyTheme', emoji: '🎯',
  palette: {
    bg:     ['#hex1', '#hex2', '#hex3'],          // 3 DISTINCT colors
    ring:   ['#hex1', '#hex2', '#hex3', '#hex4', '#hex5'],  // 5 DISTINCT colors
    shape:  ['#hex1', '#hex2', '#hex3'],          // 3 DISTINCT colors
    accent: ['#hex1', '#hex2', '#hex3'],          // 3 DISTINCT colors
  },
  bgPatterns:   ['pat1', 'pat2', 'pat3', 'pat4', 'pat5'],   // exactly 5
  ringStyles:   ['ring1', 'ring2', 'ring3'],                  // exactly 3
  shapeNames:   ['shape1', 'shape2', 'shape3', 'shape4', 'shape5'],  // exactly 5
  accentShapes: ['acc1', 'acc2', 'acc3', 'acc4', 'acc5'],    // exactly 5
}
```

**Rules:**
- ✅ Every color within a palette group must be **visually distinct** (no duplicates)
- ✅ Every pattern/shape/style name must be **globally unique** across ALL themes in that dimension
- ✅ Count must be exact: 5 bgPatterns, 3 ringStyles, 5 shapeNames, 5 accentShapes
- ✅ Palette counts must be exact: 3 bg, 5 ring, 3 shape, 3 accent

**How to check name uniqueness:** Search renderer.js for `case 'yourname'`. If it already exists in the same render function, pick a different name (prefix with theme, e.g. `filmi-star` instead of `star`).

#### Step 2: Add Renderer Cases (renderer.js)

For each new pattern name, add a `case` block in the corresponding function:

| Pattern Array | Renderer Function | Cases Needed |
|--------------|-------------------|-------------|
| `bgPatterns[5]` | `renderBg()` | 5 new cases |
| `ringStyles[3]` | `renderRing()` | 3 new cases |
| `shapeNames[5]` | `renderShape()` | 5 new cases |
| `accentShapes[5]` | `renderAccent()` | 5 new cases |

**Total: 18 new case blocks per theme.**

**Rules:**
- ✅ Add cases BEFORE the `default:` line in each function
- ✅ Every case must `return` an SVG string (never fall through to blank)
- ✅ Do NOT accidentally delete the closing `}` of the switch or function
- ✅ If your SVG needs randomness, use `mulberry32(c.charCodeAt(1))` — it's already defined at the top of the file
- ✅ The SVG viewBox is `0 0 100 100` — keep all coordinates within this space

**Template for each case:**
```javascript
    // ── MyTheme ──
    case 'pat1': {
      const o = 0.75;
      return `<rect ... fill="${c}" opacity="${o}"/>`;
    }
```

#### Step 3: Run the Validator

```bash
node validate-themes.js
```

This script checks ALL of the following automatically:

| Check | What It Catches |
|-------|----------------|
| Pool math | Wrong number of patterns/colors (would break board generation) |
| Cross-theme name uniqueness | Duplicate case labels (second one silently unreachable) |
| Engine → Renderer coverage | Pattern defined in engine.js but no case in renderer.js (blank tiles) |
| Duplicate case labels | Same case label appears twice in one function (JS pitfall) |
| Function dependencies | Calling undefined functions like mulberry32 (ReferenceError) |
| Syntax check | Missing braces, unclosed strings, malformed JS |
| Color distinctness | Identical hex codes in same palette group (unsolvable game) |
| Orphan cases | Cases in renderer with no theme using them (dead code warning) |

**The validator must show all green ✅ before committing.**

#### Step 4: Manual Smoke Test

Even with the validator passing, do a visual check:

1. Run locally: `node server.js` → open `http://localhost:3000/tiles/`
2. Click through themes until you hit yours
3. Verify all tiles render (no blank white squares)
4. Start a game, make a few matches — verify matched tiles disappear correctly
5. Check mobile viewport (responsive layout)

#### Step 5: Commit and Deploy

```bash
git add public/tiles/engine.js public/tiles/renderer.js
git commit -m "Add [ThemeName] theme to Photo Tiles"
git push
```

Wait ~2 min for Render auto-deploy. Hard-refresh (Ctrl+Shift+R) the live site to bypass cache.

### Common Pitfalls Reference

| Pitfall | Example | Prevention |
|---------|---------|-----------|
| Duplicate case name | Two themes both use `'star'` as a shape | Prefix with theme: `'filmi-star'`, `'celtic-star'` |
| Missing helper function | Case calls `mulberry32()` but it's not defined | Validator CHECK 6 catches this |
| Deleted closing brace | Adding cases at end of switch, accidentally removing `}` | Validator syntax check catches this |
| Identical palette colors | `bg: ['#333', '#333', '#333']` | Validator color check catches this |
| Wrong pattern count | 4 bgPatterns instead of 5 | Validator pool math catches this |
| Case with no return | `case 'x': { /* forgot return */ }` | Manual check — look for fall-through |
| SVG outside viewBox | Coordinates > 100 or < 0 | Keep within 0-100 range |
| Low contrast / invisible elements | Light shapes on light bg (e.g. white on pastel) | See Contrast Rule below |

### Contrast & Visibility Rule

**The problem**: Tiles use `background: rgba(255,255,255,0.88)` in CSS — a near-white base. Background patterns in `renderBg()` are layered ON TOP of this white. If the pattern color is light AND the opacity is low, the bg becomes invisible. This was the single most common visual defect across the 14-theme expansion.

**The compounding factors**:
1. **Palette lightness** — pastel/light hex values (lightness > 75%) are inherently low-contrast on white
2. **Base opacity** — `renderBg()` uses `const o = 0.75` as the base. Many patterns further reduce this with multipliers like `o*0.3` or `o*0.2`
3. **Pattern coverage** — some patterns (stripes, dots) cover only a fraction of the tile, making the remaining area pure white

**Two categories of themes and their contrast strategy**:

| Category | Strategy | Example Themes |
|----------|----------|----------------|
| **Dark-bg themes** | Solid dark fill first, light pattern details on top | Neon, Celestial, Noir, Arithmetic |
| **Colorful-bg themes** | Saturated/medium bg palette + the shared `o=0.75` opacity | Azulejo, Garden, Candy, Tropical |

**Implementation pattern for dark-bg themes:**

In `renderBg`, start each case with a solid fill before the decorative pattern:
```javascript
case 'chalkboard': {
  // 1. Solid dark fill first (makes the tile dark)
  let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.85"/>`;
  // 2. Then light-colored pattern details on top
  s += `<line ... stroke="#fff" opacity="0.2"/>`;
  return s;
}
```

**Without** the solid fill, `c` (dark green) at `opacity * 0.3 = 0.225` barely tints the white base — everything looks washed out. Arithmetic and Sky themes established this as the reference pattern; they look good because they DON'T rely on the shared `o` variable but paint their own solid rect fill first at 0.82-0.88.

**Rules for choosing bg palette colors:**
- ✅ Keep bg hex values at lightness ≤ 75% for themes using the shared `o=0.75` opacity
- ✅ If using very light colors (pastels, near-white), the bg pattern MUST paint a solid rect fill at high opacity (0.8+) before adding pattern details
- ✅ Cross-check new bg colors against shape/ring/accent colors in the same theme — if a bg color matches a shape color, tiles with that combination become unsolvable (same-color bg and foreground)
- ✅ Use Material Design color scale as a reference: the 400-600 range gives good saturation without being too dark

**Quick test**: Squint at your tiles. If you can't immediately distinguish every tile from its neighbors, the contrast is too low.
