# Husein and Fatema's Game Room — Complete Project Documentation

## Quick Resume Checklist
- **Local project**: `C:\Users\huseinm\Downloads\husein-games\`
- **GitHub repo**: https://github.com/amzocean/husein-games.git (personal account: amzocean)
- **Live URL**: https://husein-games.onrender.com
- **Intended domain**: huseinlovesyou.com (GoDaddy — DNS NOT yet pointed to Render)
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
    │   ├── style.css       # Styles
    │   ├── app.js          # Main controller (ES modules)
    │   ├── engine.js       # Board generation & game logic (6x5 grid, 30 tiles)
    │   ├── renderer.js     # SVG tile rendering (azulejo spatial-zone design)
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
- **URL**: https://husein-games.onrender.com
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
```

### DNS (NOT YET DONE)
- Domain: `huseinlovesyou.com` on GoDaddy
- Currently pointed to Netlify (old)
- To point to Render: Add CNAME record `huseinlovesyou.com` → `husein-games.onrender.com`
- Then add custom domain in Render dashboard

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
A sliding tile puzzle (like a 15-puzzle but 6×5 = 30 tiles). Match tiles by 4 visual attributes to clear them. Photos reveal underneath as tiles are cleared. Originally built as "Fatema Tiles" (source: `C:\Users\huseinm\Downloads\fatema-tiles`).

### Files
- `index.html` — HTML structure, PWA meta tags, links to CSS/JS
- `style.css` — Full styling
- `app.js` — Main application controller (ES modules, imports engine + renderer + photos)
- `engine.js` — Board generation & game logic
  - 6×5 grid (30 tiles), 4 attribute dimensions (bg pattern, ring style, center shape, accent)
  - Each dimension has 15 possible values → tiles match if they share an attribute
  - `GameState` class manages board state, matching logic, scoring
- `renderer.js` — SVG tile rendering with azulejo spatial-zone design
  - 4 visual zones per tile: background, ring, center shape, accent
  - `viewBox 0 0 100 100` — four spatially distinct zones rendered back-to-front
- `photos.js` — Loads random photo from `photos/manifest.json`
- `photos/manifest.json` — Array of photo filenames
- `photos/` — 5 personal photos (JPGs with UUID-style names + one dated photo)
- `manifest.json` — PWA manifest (app name: "huseinlovesyou")
- `sw.js` — Service worker for PWA offline capability

### Gameplay
1. Start: 30 randomly generated azulejo-style tiles on a 6×5 grid
2. Tap two tiles that share at least one visual attribute to match them
3. Matched tiles disappear, revealing a photo underneath
4. Track combo streaks and clear all 30 tiles to win
5. "✨ New" button starts a fresh board with a random photo

### Score Display
- Current combo, best combo, tiles cleared (X/30)

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

## 10. Key Bug Fixes History

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
