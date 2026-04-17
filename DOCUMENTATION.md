# Husein and Fatema's Game Room — Complete Project Documentation

## Quick Resume Checklist
- **Local project**: `C:\Users\huseinm\Downloads\husein-games\`
- **GitHub repo**: https://github.com/amzocean/husein-games.git (personal account: amzocean)
- **Live URL**: https://huseinlovesyou.com (custom domain) / https://husein-games.onrender.com (Render direct)
- **Render dashboard**: https://dashboard.render.com (free tier, auto-deploys on push to main)
- **⚠️ DO NOT modify gh CLI auth** — `gh` is linked to work account `huseinm_microsoft`. Git pushes use browser-based credential manager.

---

## 1. Architecture Overview

Single Node.js process serving everything:
- **Express** serves static files from `public/` (landing page + 3 games)
- **Socket.IO** provides real-time multiplayer for Ludo via `/ludo` namespace
- Deployed on **Render.com free tier** (spins down after 15min of no HTTP requests, ~30s cold start)

```
husein-games/
├── server.js              # Express + Socket.IO server (583 lines)
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
- `engine.js` — Board generation, game logic & **6-theme system** (~300 lines)
  - `THEMES` array defines all 6 themes (palette, patterns, styles, shapes, accents)
  - `buildPools(theme)` — generates 4 attribute pools of 15 items each from a theme
  - `generateBoard()` — picks a random theme, builds pools, creates paired 30-tile board
  - `GameState` class — manages board, matching, scoring; tracks `currentTheme`
  - Exports: `GameState`, `ROWS`, `COLS`, `TILE_COUNT`, `THEMES`
- `renderer.js` — SVG tile rendering with spatial-zone design (~608 lines)
  - 4 render functions: `renderBg()`, `renderRing()`, `renderShape()`, `renderAccent()`
  - ~90 visual element cases across all 6 themes
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

Each new game randomly selects one of **6 visual themes**. Each theme defines:
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
- **Palette**: bg `#81C784, #F48FB1, #FFD54F` / ring `#2E7D32, #C2185B, #1565C0, #F57F17, #6A1B9A` / shape `#D32F2F, #1976D2, #388E3C` / accent `#FF6F00, #7B1FA2, #00838F`
- **Bg patterns**: checkerboard, diagonal, hBars, vBars, solid
- **Ring styles**: solid, dashed, double
- **Shapes**: cross, flower, star, diamond, clover
- **Accents**: circles, diamonds, squares, triangles, dots

#### Theme 2: Celestial 🌙
- **Vibe**: Night sky, cosmic
- **Palette**: bg `#1a1a2e, #16213e, #0f3460` / ring `#e94560, #533483, #0f3460, #e9d5a1, #00b4d8` / shape `#e9d5a1, #e94560, #00b4d8` / accent `#e9d5a1, #533483, #e94560`
- **Bg patterns**: starfield, nebula, aurora, cosmic-dust, void
- **Ring styles**: glow, dotted, eclipse
- **Shapes**: crescent, starburst, hexagon, saturn, eye
- **Accents**: tiny-stars, sparks, orbs, carets, moons

#### Theme 3: Garden 🌿
- **Vibe**: Botanical, floral
- **Palette**: bg `#e8f5e9, #fff3e0, #fce4ec` / ring `#2e7d32, #c2185b, #f57f17, #00695c, #6a1b9a` / shape `#c62828, #1565c0, #2e7d32` / accent `#795548, #e65100, #1b5e20`
- **Bg patterns**: polkadots, stripes, crosshatch, petals, meadow
- **Ring styles**: vine, thorn, ribbon
- **Shapes**: heart, tulip, leaf, raindrop, sun
- **Accents**: seeds, dewdrops, buds, rosettes, thorns

#### Theme 4: Deco ✨
- **Vibe**: Art Deco geometric
- **Palette**: bg `#fdf6e3, #1a1a2e, #2c3e50` / ring `#d4af37, #c0392b, #1abc9c, #2c3e50, #8e44ad` / shape `#d4af37, #c0392b, #f5f5f5` / accent `#d4af37, #8e44ad, #1abc9c`
- **Bg patterns**: fan, sunray, chevron, scales, zigzag
- **Ring styles**: thick-thin, dotted-line, fillet
- **Shapes**: arch, bowtie, pentagon, keystone, fan-shape
- **Accents**: rays, studs, arrows, wings, bolts

#### Theme 5: Mosaic 🏺
- **Vibe**: Terracotta tessellation
- **Palette**: bg `#f5e6ca, #d4a373, #ccd5ae` / ring `#6b4226, #bc6c25, #283618, #606c38, #9b2226` / shape `#9b2226, #283618, #bc6c25` / accent `#6b4226, #283618, #9b2226`
- **Bg patterns**: triangles, hexgrid, brickwork, pinwheel, terrazzo
- **Ring styles**: rope, notched, inset
- **Shapes**: octagon, arrow-shape, hourglass, shield, spiral
- **Accents**: plus-signs, arrowheads, wedges, pips, nails

#### Theme 6: Candy 🍬
- **Vibe**: Sweet shop, playful
- **Palette**: bg `#ffe0f0, #e0f7fa, #fff9c4` / ring `#ec407a, #ab47bc, #26c6da, #66bb6a, #ffa726` / shape `#e91e63, #7b1fa2, #00bcd4` / accent `#ff7043, #66bb6a, #fdd835`
- **Bg patterns**: sprinkles, swirl, wafer, gingham, frosted
- **Ring styles**: frosting, licorice, candy-dots
- **Shapes**: lollipop, gumdrop, pretzel, donut, bonbon
- **Accents**: mini-sprinkles, cherries, drops, gumballs, mini-hearts

### Renderer Architecture

Each tile is an SVG `viewBox 0 0 100 100` with 4 layered zones (back-to-front):
1. **Background** (full tile, 4-96 inset) — `renderBg(attr)` — 30 pattern cases
2. **Ring** (border frame) — `renderRing(attr)` — 18 style cases
3. **Accent** (4 corners at `[[16,16],[84,16],[16,84],[84,84]]`) — `renderAccent(attr)` — 30 accent cases
4. **Shape** (center, ~28-72 extent) — `renderShape(attr)` — 30 shape cases

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
- **Player colors** (mapped from internal keys red/green/yellow/blue):
  | Key | Display Name | Fill | Light (base/path) | Dark (borders) |
  |-----|-------------|------|-------------------|----------------|
  | red | Rose | `#c44569` | `#fce4ec` | `#8e1942` |
  | green | Gold | `#b8860b` | `#faf0d0` | `#6d5006` |
  | yellow | Teal | `#2a9d8f` | `#d5f0eb` | `#176b60` |
  | blue | Indigo | `#3355a0` | `#dce4f5` | `#1a2d5e` |
- Center HOME triangle uses same `COLORS[x].fill` values
- Capture flash uses Rose `#c44569`

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
7. Start 60-second auto-play timer

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
Keep all existing 8 themes (colorful, playful) AND add a new class of **geometric/architectural themes** with limited palettes and rich pattern variety. The game should offer a wide spectrum — from fun colorful themes like Candy and Celestial to sophisticated monochrome pattern-based themes.

### Two Engine Modes

The current engine uses **Color Mode**: `5 patterns x 3 colors = 15` per dimension. This works great for colorful themes but limits monochrome designs (repeating the same color makes tiles visually identical but with different IDs, breaking solvability).

A new **Pattern Mode** would use: `15 unique patterns x 1 color = 15` per dimension. All differentiation comes from shapes, line work, and geometric complexity — not color.

`buildPools()` would need a `monochrome: true` flag (or similar) to switch between the two generation strategies.

### Inspiration & Aesthetic References

| Style | Description | Color Palette |
|-------|------------|---------------|
| **Moorish/Moroccan** | Compass stars, diamond frames, geometric interlocking | Black + gold on white |
| **Portuguese Azulejo** | Intricate line art tiles, floral & geometric | Blue on white |
| **Noir (reworked)** | Intricate line art, stipple, crosshatch | White on black |
| **Sepia (reworked)** | Vintage engraving style, ornate frames | Brown on parchment |

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

**Palette-only themes** (keep current 4-zone structure, new vibes):
- **Neon/Cyberpunk** — electric pinks, blacks, glowing greens
- **Pastel Dreamscape** — soft muted tones
- **Earth & Clay** — terracotta, olive, sand, stone

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
| Tiles blank after Neon/Tropical theme add | Sub-agent placed `default: return '';` but deleted the closing `}` of the switch + function in `renderBg` and `renderRing` — brace count coincidentally balanced | Re-added missing closing braces; added structural validation to catch this |
| Indian/Bollywood/Arithmetic themes blank tiles | `mulberry32()` PRNG called by 5 patterns (paisley, sequins, disco-floor, chalkboard, sequin-border) but never defined in renderer.js — `ReferenceError` crashed tile rendering | Added `mulberry32` function definition at top of renderer.js |
| Bollywood star shape never renders | Duplicate `case 'star'` in renderShape — Azulejo's 8-pointed star (earlier in file) always matched first, Bollywood's was unreachable | Renamed Bollywood's to `case 'filmi-star'` in both engine.js and renderer.js |
| Noir/Sepia game unsolvable | Palette had identical repeated colors (e.g. 3x `#212121`) — tiles visually identical but different IDs | Changed to distinct shades within same hue family |

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
      const o = 0.6;
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

**Problem**: The Arithmetic theme originally rendered faint green lines on a white tile — shapes like π and ÷ in white/yellow were nearly invisible.

**Rule**: Every tile must have strong visual contrast between its background and its foreground elements (shapes, rings, accents).

Two valid approaches:

| Approach | When to Use | Example |
|----------|------------|---------|
| **Dark fill + light elements** | Theme has a "surface" feel (chalkboard, night sky) | Arithmetic: solid dark green bg → white/yellow shapes pop |
| **Light fill + bold dark elements** | Theme is bright/colorful | Candy: pastel bg → saturated shapes |

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

**Without** the solid fill, `c` (dark green) at `opacity * 0.3 = 0.18` barely tints the white base → everything looks washed out.

**Quick test**: Squint at your tiles. If you can't immediately distinguish every tile from its neighbors, the contrast is too low.
