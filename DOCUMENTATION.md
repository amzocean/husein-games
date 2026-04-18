# Husein and Fatema's Game Room — Developer Documentation

## 1. Introduction & Project Context

This is a personal game portal built for Husein and Fatema — a romantic-themed website at **huseinlovesyou.com** that hosts 3 browser games. It's a single Node.js process (Express + Socket.IO) deployed on Render.com's free tier.

**The 3 games:**
- **💌 Valentines** — A love-letter puzzle adventure (single-player, fully static, 6 levels)
- **🧩 Photo Tiles** — A pattern-matching tile puzzle with 16 procedurally-rendered SVG themes (single-player, no server logic)
- **🎲 Ludo** — Classic board game, 2-4 players, real-time multiplayer via Socket.IO with Canvas rendering

**What a new session needs to know immediately:**
- The Photo Tiles game is the most actively developed — it has 16 visual themes, each requiring ~16 SVG render cases in `renderer.js` (~1870 lines). Theme work is where most bugs have occurred (see Bug Fixes History and Section 11: New Theme Creation Guide).
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
    │   ├── style.css       # Styles (5×5 grid, center-tile heartbeat, theme toast)
    │   ├── app.js          # Main controller (ES modules, center tile skip, theme toast)
    │   ├── engine.js       # Board generation, game logic, 16-theme system (~448 lines)
    │   ├── renderer.js     # SVG tile rendering — 16 themes, ~240 visual elements (~1870 lines)
    │   ├── photos.js       # Photo loader from manifest
    │   ├── photos/         # 5 personal photos + manifest.json
    │   ├── manifest.json   # PWA manifest
    │   └── sw.js           # Service worker
    │   └── validate-themes.js  # Pre-commit validator (10 checks)
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

### Deployment & Domain
- **Render build**: `npm install` → **start**: `node server.js`
- **Auto-deploy**: Connected to GitHub repo, deploys on every push to `main`
- **Free tier behavior**: Spins down after 15min of no HTTP requests. Socket.IO heartbeats (every 25s) keep it alive while players are connected.
- **Custom domain**: `huseinlovesyou.com` (GoDaddy) — `A` record → `216.24.57.1` (Render LB), `CNAME www` → `husein-games.onrender.com`. Both verified with Let's Encrypt SSL.

### Caching — Mobile Browsers Are Aggressive

`express.static` serves files with default ETags but no explicit Cache-Control header. Mobile browsers (especially iOS Safari) interpret this as "cache indefinitely" and may serve stale HTML for days.

**Solution**: Middleware before `express.static` sets `Cache-Control: no-cache` on HTML and directory requests. This doesn't disable caching — it forces revalidation. The browser sends an `If-None-Match` header, server responds 304 (Not Modified, no body) if unchanged. Overhead is ~200-500 bytes per page load.

**What NOT to do:**
- Don't use `no-store` — that disables caching entirely, forcing full re-download every time
- Don't set `max-age: 0` alone — some browsers treat this differently from `no-cache`
- Don't add cache-busting query strings to Socket.IO URLs — the library handles its own versioning
- Don't apply `no-cache` to images/CSS/JS unless they change frequently — those are fine to cache

---

## 5. Photo Tiles Game (`public/tiles/`)

### Overview
A pattern-matching tile puzzle (5×5 = 25 tiles, 24 active + 1 decorative center). Match tiles by shared visual attributes to clear them. A surprise photo reveals underneath as tiles are cleared (jigsaw-style). Originally built as "Fatema Tiles" (source: `C:\Users\huseinm\Downloads\fatema-tiles`).

### Architecture (v2 — April 2026 Redesign)

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

### Files
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
- `photos.js` — Loads random photo from `photos/manifest.json`
- `photos/` — Personal photos revealed as tiles are cleared
- `validate-themes.js` — Pre-commit theme validator (10 checks, all must pass)

### Tile SVG Layer Stack (back-to-front)

Each active tile SVG (`viewBox 0 0 100 100`) contains:

```
Layer 1: <rect fill="white"/>                              ← fully opaque white base (blocks photo)
Layer 2: <rect fill="${boardBg.color}" opacity="0.12"/>    ← very subtle theme tint
Layer 3: <g class="board-bg-layer">${renderBg(boardBg)}</g> ← pattern overlay (SKIPPED for 'solid' themes)
Layer 4: matchable attribute layers (ring, shape, accent)   ← what the player actually matches on
```

When a tile is cleared (matched), the whole tile element goes to `opacity: 0`, revealing the photo CSS `background-image` on the board div underneath — creating a jigsaw reveal effect.

### Center Heart Tile (index 12)

The center tile at grid position [2,2] shows an **h❤f** monogram:
- **h** — italic serif, uses theme's first ring color
- **❤** — heart path, uses theme's first accent color, heartbeat CSS animation
- **f** — italic serif, uses theme's second ring color
- The whole tile pulses with a realistic double-pump heartbeat (1.2s cycle)
- On game win, the center tile animates out (scale down + fade)

### Board Background System

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

### Gameplay
1. Start: 24 randomly generated tiles on a 5×5 grid (center = decorative h❤f heart) — theme chosen randomly
2. Theme name + emoji shown briefly as a toast overlay (e.g. "🌙 Celestial")
3. Tap two tiles that share at least one visual attribute (ring, shape, or accent) to match them
4. Matched tiles fade out, revealing a photo underneath (jigsaw reveal)
5. Track combo streaks and clear all 24 tiles to win
6. "✨ New" button starts a fresh board with a new random theme + random photo

### Score Display
- Current combo, best combo, tiles cleared (X/24)

---

## 6. Ludo Game — Detailed Reference

### Overview
Classic Ludo board game ("H&F Ludo"), 2-4 players, real-time multiplayer via Socket.IO. Mobile-optimized with Canvas rendering, sound effects, haptic feedback, spectator mode, exit/end game controls, dice roll animation, token step-by-step animation, confetti on win, emoji reactions, turn timer countdown, in-game chat, and per-player board rotation.

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

### Client: `public/ludo/index.html` (~1140 lines)

Single file containing all HTML, CSS, and JavaScript.

#### Screens (CSS class `.screen`, toggled via `.active`)
1. **`screen-idle`** — No game running. Shows "Create Game" button with name input.
2. **`screen-lobby`** — Game created, waiting for players. Shows player list with color dots, join form, and start button (creator only, 2+ players required).
3. **`screen-playing`** — Active game. Canvas board, dice button, turn indicator, pick/no-move hints, capture banner, turn timer bar, emoji reaction bar, chat panel, exit/end game buttons. Debug panel exists in HTML but is hidden (activation code commented out).
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

#### Dice Roll Animation
- Dice icon shows a brief CSS tumble animation before revealing the result
- Pure CSS keyframe animation, no external assets

#### Token Move Animation
- Tokens animate step-by-step along the path instead of teleporting
- Canvas tweening with configurable speed per step
- Handles both normal path movement and home stretch entry

#### Confetti on Win
- Canvas particle burst when a player wins
- Random colors, velocities, and gravity simulation
- Purely cosmetic, auto-clears after animation

#### Emoji Reactions
- Players can send quick emoji reactions (❤️ 😂 😤 🎉 👋) during gameplay
- Socket.IO `emoji` event — server validates sender, broadcasts to all
- Emoji floats above the board briefly then fades out
- Minimal server logic — no game state impact

#### Turn Timer Countdown Bar
- Green bar below the turn indicator drains over the 60-second turn window
- Server sets `game.turnDeadline` at turn start, sends `turnTimeLeft` and `turnDuration` in state
- Client uses CSS `transition` technique: jump bar width to current %, force reflow, then transition to 0% over remaining time
- Avoids clock-sync issues by using relative milliseconds, not absolute timestamps
- Bar resets on each new turn

#### Game Chat
- Collapsible chat panel at the bottom of the playing screen
- Toggle via "💬 Chat" button with unread badge counter
- Server validates sender by sessionId, trims messages to 200 chars, broadcasts `{name, color, text}`
- Client renders messages color-coded by player, 50-message buffer, auto-scrolls
- Ephemeral — chat history lost on page refresh (by design, no persistence)

#### Board Rotation (Per-Player View)
- Each player sees the board rotated so their base is always in the **bottom-left** corner (closest to the dice)
- Implemented via canvas `ctx.translate(center) → ctx.rotate(θ) → ctx.translate(-center)` wrapper around `drawBoard()`
- Rotation angles: Red=0, Green=3π/2 (270° CW), Yellow=π (180°), Blue=π/2 (90° CW)
- Click handling uses inverse rotation transform: `cos(-θ)/sin(-θ)` to map screen coordinates back to logical board coordinates
- `getBoardRotation(color)` returns the angle; `getMyColor()` determines current player's color from session
- Spectators see the unrotated (Red=bottom-left) default view

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

### Server: Ludo section of `server.js` (lines 14-613)

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
  autoPlayTimer: timeout,
  turnDeadline: number | null     // Date.now() + AUTO_PLAY_DELAY, for client countdown
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
| `emoji` | `{ sessionId, emoji }` | Send emoji reaction (❤️ 😂 😤 🎉 👋) |
| `chat` | `{ sessionId, text }` | Send chat message (max 200 chars) |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `state` | full game state object | Broadcast after every change (includes `turnTimeLeft`, `turnDuration`) |
| `session` | `sessionId` | Sent once on create/join |
| `error_msg` | `string` | Error message |
| `emoji` | `{ name, color, emoji }` | Broadcast emoji reaction to all clients |
| `chat` | `{ name, color, text }` | Broadcast chat message to all clients |

#### Game Flow
1. **Idle** → Someone creates a game → **Lobby**
2. **Lobby** → Players join (2-4). Creator clicks Start → **Playing**
3. **Playing** → Players take turns rolling dice and moving tokens
4. **Finished** → Someone gets all 4 tokens to step 57, or timeout/disconnect
5. Auto-reset to **Idle** after 30 seconds (10s for idle timeout)

#### Dice Roll Boost (DISABLED)
- **Currently disabled** (code commented out) — having the boost reduced the negative impact of captures, which was undesirable
- When enabled: if all 4 of a player's tokens are in base (step 0), ~33% chance of rolling 6
- Normal: uniform random 1-6
- Re-evaluates each roll dynamically
- To re-enable: uncomment the `allInBase` / boosted roll block in the `roll` handler in server.js

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

**Design note — why 5 locations**: See "The 5 Code Paths Problem" section below for the full table and rationale.

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

**Design note — why clear AFTER broadcast, not before**: See "State Lifecycle — When to Clear Transient Fields" section below for the full pattern table.

**Design note — why not clear on client side only**: The server is the source of truth — if the server keeps sending stale data, every new client connection (spectators, reconnects) would also see the ghost banner. Fixing at the source is cleaner.

#### Logging
- All server events logged with `[LUDO HH:MM:SS.mmm]` prefix
- Key events: CONNECT, DISCONNECT, REJOIN, CREATE, JOIN, START, ROLL, MOVE, CAPTURE, AUTO-PLAY, GAME OVER, GRACE EXPIRED

### Design Pitfalls & Patterns

Read this BEFORE making Ludo changes to avoid re-introducing fixed bugs.

#### The "5 Code Paths" Problem

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

#### State Lifecycle — When to Clear Transient Fields

The `game` object holds both persistent state (tokens, players, phase) and transient state (lastCapture, diceValue). Transient fields that trigger client UI effects MUST be cleared after exactly one broadcast:

| Field | Set By | Cleared By | If Not Cleared |
|-------|--------|-----------|----------------|
| `lastCapture` | `checkCapture()` | `nextTurn()` after `broadcastState()` | Banner re-appears on every broadcast forever |
| `diceValue` | Roll handler | `nextTurn()` before broadcast | Previous dice shows on next player's turn |
| `diceRolled` | Roll handler | `nextTurn()` before broadcast | Next player can't roll |

**Pattern**: Clear transient UI-trigger fields AFTER `broadcastState()` if clients need to see them once, or BEFORE if clients should never see stale values. `lastCapture` is the "after" pattern (show once then clear). `diceValue/diceRolled` is the "before" pattern (clean slate for next turn).

#### Color System — The COLORS Object is the Single Source of Truth

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

#### broadcastState() — The Central Sync Mechanism

Every game state change MUST go through `broadcastState()` to reach all clients. Common mistakes:

1. **Mutating state AFTER broadcast but expecting clients to see it**: If you change `game.foo` after `broadcastState()`, clients won't see it until the next broadcast. This is sometimes intentional (lastCapture clearing) but must be deliberate.

2. **Forgetting to broadcast**: If you change game state but don't call `broadcastState()` or `nextTurn()` (which calls it internally), clients will be out of sync until the next action triggers a broadcast.

3. **Broadcasting too often**: Each `broadcastState()` sends the full game state to all connected clients. Don't call it in a tight loop. The current architecture calls it at natural break points: after roll, after move, after turn change.

---

## 7. Valentines Game (`public/valentines/`)

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

## 8. Landing Page (`public/index.html`)

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

## 9. Known Issues & Limitations

1. **In-memory game state**: Render process restart loses the game. No persistence layer. Free tier can restart anytime (though Socket.IO heartbeats prevent idle shutdown while connected).

2. **Single game at a time**: Only one Ludo game can run globally. By design — "not very sophisticated, just have one game running at any point."

3. **No authentication**: Players identified by UUID sessionId stored in localStorage (`ludo_session`). Refreshing reloads sessionId from localStorage; `visibilitychange` handles tab suspension.

4. **Winner display shows player name**: If a player names themselves "2", it shows "2 wins!" — this is correct behavior, not a bug.

---

## 10. Common Tasks

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

## 11. New Theme Creation Guide

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

## 12. Key Bug Fixes History

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
| **Celestial tiles appear all-white** | `createTileSVG()` starts every tile with `fill="white" opacity="0.1"` base rect. Celestial bg patterns (starfield, nebula, aurora, cosmic-dust, void) only drew tiny decorative elements (2px stars, faint ellipses at 0.25-0.4 opacity) with NO base area fill — the white base showed through. Newer themes (Arithmetic, Sky) correctly start each bg pattern with a solid `<rect>` fill. | Added `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25-0.3}"/>` as the first SVG element in all 5 Celestial bg patterns to provide a visible color base tint. |
| **36 sparse bg patterns across 10 themes** | Same root cause as Celestial: older bg patterns only drew decorative line work (dots, thin strokes, arcs) without a base area fill. Affected: Garden (5), Deco (5), Neon (5), Indian (5), Tropical (4), Mosaic (2), Candy (2), Noir (3), Sepia (3), Bollywood (2). Patterns with existing area coverage (e.g. checkerboard, gingham, sunset-gradient, disco-floor) were unaffected. | Added base tint `<rect>` as first SVG element in each sparse pattern. Opacity multiplier chosen per-theme: `o*0.25` for patterns with moderate decorative coverage, `o*0.3` for very sparse patterns (scattered dots, thin lines). |
| **Bg palette hue diversity** | Arctic theme used 3 shades of blue as bg colors — tiles looked monochrome despite technically distinct hex values. Arithmetic had 3 shades of green. | Diversified bg palettes (Arctic: blue+ice-white+lavender; Arithmetic: green+cream+brown). Added validator CHECK 9: bg hue diversity requires 40° minimum hue spread across the 3 bg colors (Noir/Sepia/Neon exempt as intentionally narrow palettes). |
| **Board rotation Green/Blue swap** | Board rotation feature placed each player's base at bottom-left, but Green (π/2) and Blue (3π/2) angles were swapped. Green base appeared at top-right instead of bottom-left; Blue base appeared at top-left. | Swapped the two values in `getBoardRotation()`: Green=3π/2 (270° CW), Blue=π/2 (90° CW). Verified with 2D rotation math: 3π/2 maps top-left→bottom-left, π/2 maps bottom-right→bottom-left. |

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
| **7 themes with invisible palette colors** | Ring/shape/accent palettes used whites, light grays, bright yellows, pastels — all invisible on near-white tile backgrounds | Batch fix: Arctic, Noir, Neon, Arithmetic, Street Food, Celestial, Sepia — substituted every light color with a dark variant from same hue. See Section 11 for the full "Colors That Failed" table. |
| **Street Food elements too thin** | Ring strokes and accent sizes below visibility thresholds — elements present but essentially invisible | Boosted ring stroke widths and accent sizes specifically for Street Food; then caught the same issue globally (the "197 fixes" above) |
| **Center heart off-center** | Heart SVG Y position was calculated from top of viewBox, not visual center | Adjusted Y translate position in `createCenterHeartSVG()` for visual centering |
| **h❤f letter spacing uneven** | "h" at x=22, heart at x=50, "f" at x=78 — gap before heart was larger than gap after | Adjusted: h at x=20, heart at x=52, f at x=80 — optically balanced |

---

## 13. Future Ideas — Photo Tiles

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

> **v2 changes from v1**: Ring palette reduced 5→4 colors. shapeNames reduced 5→4. accentShapes reduced 5→4. Added `boardBg` per theme. Several themes had palette colors replaced for visibility (see Section 12).

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

---

## Appendix B: Original Source Locations

| Game | Original Location | Notes |
|------|-------------------|-------|
| Valentines | `C:\Users\huseinm\OneDrive - Microsoft\Documents\ValenineSite` | Copied to public/valentines/ |
| Photo Tiles | `C:\Users\huseinm\Downloads\fatema-tiles` | Copied to public/tiles/ |
| Ludo | `C:\Users\huseinm\ludo-game\` | Original standalone version (may still exist). Portal version modified for /ludo namespace. |
