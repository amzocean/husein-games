# Ludo Game — Developer Documentation

> **Parent doc**: [../../DOCUMENTATION.md](../../DOCUMENTATION.md) (project-wide architecture, deployment, common tasks)

---

## Overview
Classic Ludo board game ("H&F Ludo"), 2-4 players, real-time multiplayer via Socket.IO. Mobile-optimized with Canvas rendering, sound effects, haptic feedback, spectator mode, exit/end game controls, dice roll animation, token step-by-step animation, confetti on win, emoji reactions, turn timer countdown, in-game chat, and per-player board rotation.

## Visual Theme
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

## Client: `public/ludo/index.html` (~1140 lines)

Single file containing all HTML, CSS, and JavaScript.

### Screens (CSS class `.screen`, toggled via `.active`)
1. **`screen-idle`** — No game running. Shows "Create Game" button with name input.
2. **`screen-lobby`** — Game created, waiting for players. Shows player list with color dots, join form, and start button (creator only, 2+ players required).
3. **`screen-playing`** — Active game. Canvas board, dice button, turn indicator, pick/no-move hints, capture banner, turn timer bar, emoji reaction bar, chat panel, exit/end game buttons. Debug panel exists in HTML but is hidden (activation code commented out).
4. **`screen-finished`** — Game over. Shows final board state, winner message, and "New Game" button.

### Board Geometry (15×15 grid, Canvas)
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

### Token Rendering
- Global position grouping across ALL colors (not per-color) — prevents overlap
- Tokens at same position fan out: offset by index, scaled down when stacked
- Movable tokens get a pulsing golden glow highlight
- Finished tokens (step 57) shown in center HOME area

### Dice Roll Animation
- Dice icon shows a brief CSS tumble animation before revealing the result
- Pure CSS keyframe animation, no external assets

### Token Move Animation
- Tokens animate step-by-step along the path instead of teleporting
- Canvas tweening with configurable speed per step
- Handles both normal path movement and home stretch entry

### Confetti on Win
- Canvas particle burst when a player wins
- Random colors, velocities, and gravity simulation
- Purely cosmetic, auto-clears after animation

### Emoji Reactions
- Players can send quick emoji reactions (❤️ 😂 😤 🎉 👋) during gameplay
- Socket.IO `emoji` event — server validates sender, broadcasts to all
- Emoji floats above the board briefly then fades out
- Minimal server logic — no game state impact

### Turn Timer Countdown Bar
- Green bar below the turn indicator drains over the 60-second turn window
- Server sets `game.turnDeadline` at turn start, sends `turnTimeLeft` and `turnDuration` in state
- Client uses CSS `transition` technique: jump bar width to current %, force reflow, then transition to 0% over remaining time
- Avoids clock-sync issues by using relative milliseconds, not absolute timestamps
- Bar resets on each new turn

### Game Chat
- Collapsible chat panel at the bottom of the playing screen
- Toggle via "💬 Chat" button with unread badge counter
- Server validates sender by sessionId, trims messages to 200 chars, broadcasts `{name, color, text}`
- Client renders messages color-coded by player, 50-message buffer, auto-scrolls
- Ephemeral — chat history lost on page refresh (by design, no persistence)

### Board Rotation (Per-Player View)
- Each player sees the board rotated so their base is always in the **bottom-left** corner (closest to the dice)
- Implemented via canvas `ctx.translate(center) → ctx.rotate(θ) → ctx.translate(-center)` wrapper around `drawBoard()`
- Rotation angles: Red=0, Green=3π/2 (270° CW), Yellow=π (180°), Blue=π/2 (90° CW)
- Click handling uses inverse rotation transform: `cos(-θ)/sin(-θ)` to map screen coordinates back to logical board coordinates
- `getBoardRotation(color)` returns the angle; `getMyColor()` determines current player's color from session
- Spectators see the unrotated (Red=bottom-left) default view

### Sound Effects (Web Audio API, no external files)
- `sfxRoll()` — Dice roll sound (noise burst)
- `sfxMove()` — Token move (short beep)
- `sfxLeaveBase()` — Token leaves base (ascending tone)
- `sfxCapture()` — Capture (descending sawtooth)
- `sfxYourTurn()` — Your turn notification (gentle chime)
- `sfxWin()` — Win fanfare (ascending arpeggio)
- Sound toggle button (🔊/🔇) persisted in `localStorage` key `ludo_sound`
- AudioContext created lazily, resumed if suspended (mobile autoplay policy)

### Haptic Feedback
- `hapticLight()` — 10ms vibration (dice roll, token move)
- `hapticMedium()` — 30ms (leave base)
- `hapticHeavy()` — [50, 30, 100] pattern (capture)
- Via `navigator.vibrate()` — works on Android, limited iOS support

### Socket.IO Connection
- Connects to `/ludo` namespace: `io('/ludo')`
- Session persistence: `mySessionId` stored in JS variable (not localStorage)
- On reconnect (`socket.on('connect')`): auto-sends `rejoin` with sessionId
- `visibilitychange` listener: forces reconnect when tab becomes visible again

### Debug Panel
- HTML and JS code preserved but **disabled** in production
- Activation code (5 rapid taps on dice area) is commented out in the JS
- To re-enable: uncomment the `debugTapCount` / `addEventListener` block (~line 818)
- Force dice value buttons (1-6) — only works on your turn
- Sends `debug_roll` event to server

### Exit & End Game Controls
- **🚪 Exit Game** — visible to all players during gameplay
  - Removes the player from the game (tokens deleted, player array spliced)
  - If only 1 player remains, they win by default
  - Adjusts `currentPlayerIndex` correctly if exiting player was mid-turn
  - Requires confirmation dialog
- **⛔ End Game** — visible only to the game creator (players[0])
  - Force-ends the game for everyone, resets to idle
  - Server validates that only `players[0].sessionId` can trigger this
  - Requires confirmation dialog

## Server: Ludo section of `server.js` (lines 14-613)

### Constants
```javascript
COLORS = ['red', 'green', 'yellow', 'blue']
IDLE_TIMEOUT = 30 * 60 * 1000      // 30 minutes — no turns taken
TURN_SKIP_DELAY = 1500              // 1.5s pause before auto-skipping (no valid moves)
DISCONNECT_GRACE = 15 * 60 * 1000   // 15 minutes — socket drop grace period
AUTO_PLAY_DELAY = 60 * 1000         // 1 minute — auto-play idle player's turn
```

### Game State Object (`game`)
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

### Socket Events (server ↔ client)

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

### Game Flow
1. **Idle** → Someone creates a game → **Lobby**
2. **Lobby** → Players join (2-4). Creator clicks Start → **Playing**
3. **Playing** → Players take turns rolling dice and moving tokens
4. **Finished** → Someone gets all 4 tokens to step 57, or timeout/disconnect
5. Auto-reset to **Idle** after 30 seconds (10s for idle timeout)

### Dice Roll Boost (DISABLED)
- **Currently disabled** (code commented out) — having the boost reduced the negative impact of captures, which was undesirable
- When enabled: if all 4 of a player's tokens are in base (step 0), ~33% chance of rolling 6
- Normal: uniform random 1-6
- Re-evaluates each roll dynamically
- To re-enable: uncomment the `allInBase` / boosted roll block in the `roll` handler in server.js

### Turn Logic (`nextTurn()`)
1. Clear turnTimer and autoPlayTimer
2. Reset idle timer
3. Clear dice state
4. Advance to next connected player (skip disconnected)
5. If no connected players → game over
6. Broadcast state
7. **Clear `game.lastCapture = null`** (after broadcast — ensures exactly-once delivery)
8. Start 60-second auto-play timer

### Auto-Play Timer (`startAutoPlayTimer()`)
- Single 60-second timer covers the ENTIRE turn (roll + token pick)
- If player hasn't rolled: auto-roll + auto-move (random valid token)
- If player rolled but hasn't picked: auto-pick random valid token
- Timer starts at turn begin, does NOT reset on roll (one deadline for whole turn)
- Cleared only when player completes their move (via `move` handler)

### Post-Roll Logic (after dice roll)
- **0 movable tokens**: Show dice, auto-skip turn after 1.5s
- **1 movable token**: Show dice for 1s, then auto-move that token
- **2+ movable tokens**: Show dice, wait for player to tap a token (auto-play timer still ticking)

### Extra Turn Rules
- Rolling a 6 → extra turn
- Capturing an opponent → extra turn
- **Token reaching home (step 57) → extra turn**
- Extra turn means the same player rolls again immediately (no turn advancement)
- All three conditions are checked at every code path where a move completes (5 locations — see design note below)
- Win check runs BEFORE extra turn check, so if the last token reaches home, the game ends rather than granting a useless extra turn

**Design note — why 5 locations**: See "The 5 Code Paths Problem" section below for the full table and rationale.

### Capture Mechanics
- Landing on opponent's token on the common path sends them back to base (step 0)
- Safe squares are immune to capture (indices 0, 8, 13, 21, 26, 34, 39, 47)
- Home stretch is immune (steps 52-57)
- `lastCapture` stored in game state for client banner display

### Disconnect Handling
- Socket disconnect → 15-minute grace period starts
- If player reconnects within grace → timer cleared, game continues
- If grace expires:
  - Player marked `connected: false`
  - If ≤1 connected player → game over (last player standing wins)
  - If disconnected player was current → advance turn
- `visibilitychange` on client auto-reconnects when tab becomes visible

### Spectator Mode
- Non-players connecting during an active game see the live board
- Turn indicator shows "👀 Spectating — [name]'s turn"
- Dice area and control hints hidden
- Capture banners still visible
- Can join the next game after reset

### Capture Banner
- Shows "💥 [attacker] captured [victim]!" with attacker's color background
- Auto-hides after 3 seconds (client-side timer)
- **Server clears `game.lastCapture = null` immediately after `broadcastState()` in `nextTurn()`** — this ensures the capture info is broadcast exactly once, then all subsequent state broadcasts have `lastCapture: null`
- Client checks `state.lastCapture` on every state update: non-null shows banner, null hides it

**Design note — why clear AFTER broadcast, not before**: See "State Lifecycle — When to Clear Transient Fields" section below for the full pattern table.

**Design note — why not clear on client side only**: The server is the source of truth — if the server keeps sending stale data, every new client connection (spectators, reconnects) would also see the ghost banner. Fixing at the source is cleaner.

### Logging
- All server events logged with `[LUDO HH:MM:SS.mmm]` prefix
- Key events: CONNECT, DISCONNECT, REJOIN, CREATE, JOIN, START, ROLL, MOVE, CAPTURE, AUTO-PLAY, GAME OVER, GRACE EXPIRED

## Design Pitfalls & Patterns

Read this BEFORE making Ludo changes to avoid re-introducing fixed bugs.

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

### broadcastState() — The Central Sync Mechanism

Every game state change MUST go through `broadcastState()` to reach all clients. Common mistakes:

1. **Mutating state AFTER broadcast but expecting clients to see it**: If you change `game.foo` after `broadcastState()`, clients won't see it until the next broadcast. This is sometimes intentional (lastCapture clearing) but must be deliberate.

2. **Forgetting to broadcast**: If you change game state but don't call `broadcastState()` or `nextTurn()` (which calls it internally), clients will be out of sync until the next action triggers a broadcast.

3. **Broadcasting too often**: Each `broadcastState()` sends the full game state to all connected clients. Don't call it in a tight loop. The current architecture calls it at natural break points: after roll, after move, after turn change.

---

## Key Bug Fixes History

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Game ends randomly mid-play | Aggressive 15s disconnect grace — mobile suspends sockets | Increased to 15 min + added visibilitychange auto-reconnect |
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
| **Board rotation Green/Blue swap** | Board rotation feature placed each player's base at bottom-left, but Green (π/2) and Blue (3π/2) angles were swapped. Green base appeared at top-right instead of bottom-left; Blue base appeared at top-left. | Swapped the two values in `getBoardRotation()`: Green=3π/2 (270° CW), Blue=π/2 (90° CW). Verified with 2D rotation math: 3π/2 maps top-left→bottom-left, π/2 maps bottom-right→bottom-left. |
