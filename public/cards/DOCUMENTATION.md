# H♥F Deal — Developer Documentation

> **Parent doc**: [../../DOCUMENTATION.md](../../DOCUMENTATION.md) (project-wide architecture, deployment, common tasks)

---

## Overview

A 2-player card game inspired by Monopoly Deal (but simplified, copyright-free). Players collect property sets, bank money, and play action cards (Rent, Steal, Swap, Wild, Block). First to complete **3 full property sets** wins. Built for quick 15-20 minute sessions over a call.

**Why "H♥F Deal" instead of "Monopoly Deal"?**
Monopoly is a Hasbro trademark. The mechanics (collect sets, charge rent, steal) are not copyrightable — only the name and branding are. "H♥F Deal" uses the same core gameplay loop but with a simplified ruleset and original card design.

---

## Game Rules (V1)

### Objective
First player to complete **3 full property sets** (3 cards each) wins.

### Components

| Card Type | Count | Details |
|-----------|-------|---------|
| Property (Blue) | 6 | Color: blue, needs 3 for a set |
| Property (Red) | 6 | Color: red, needs 3 for a set |
| Property (Green) | 6 | Color: green, needs 3 for a set |
| Money | 10 | Values: 1×3, 2×3, 3×2, 5×2 |
| Rent | 6 | Charge opponent based on your set size |
| Steal | 5 | Take 1 property from opponent's incomplete set |
| Swap | 4 | Exchange 1 property with opponent |
| Wild | 4 | Plays as any color property |
| Block | 4 | Cancel any action played against you |
| **Total** | **51** | |

### Turn Flow
1. **Draw 2 cards** (automatic)
2. **Play up to 3 actions** — any combination of:
   - Play a property card to your area
   - Bank a money card
   - Play an action card (Rent, Steal, Swap, Wild)
3. **End turn** (manual button, or auto after 3 actions)
4. **Discard** down to 7 if over hand limit

### Key Rules
- **Complete sets are locked** — cannot be stolen or swapped
- **Rent amount** = number of cards in chosen color set (e.g., 2 red properties = $2 rent)
- **Rent payment is manual** — target player selects which money/properties to give up (not automated). Money goes to actor's bank; sacrificed properties go to actor's property area.
- **Block** is reactive only — can only be played when an action targets you (15-second timer)
- **Wild cards** — player chooses color when played; tracked via `assignedColor` field
- **Empty deck** — discard pile is reshuffled; if both empty, draw fewer cards
- **Hand limit** — max 7 cards; must discard excess at end of turn

---

## Visual Theme
- **Dark theme** — background `#0a0a1a`, matches the portal's dark aesthetic
- **Card colors** — gradient backgrounds per type:
  | Type | Gradient | Border |
  |------|----------|--------|
  | Blue property | `#2563eb → #1d4ed8` | `#3b82f6` |
  | Red property | `#dc2626 → #b91c1c` | `#ef4444` |
  | Green property | `#16a34a → #15803d` | `#22c55e` |
  | Money | `#854d0e → #a16207` | `#ca8a04` |
  | Rent | `#9333ea → #7e22ce` | `#a855f7` |
  | Steal | `#be185d → #9d174d` | `#ec4899` |
  | Swap | `#0891b2 → #0e7490` | `#22d3ee` |
  | Wild | `#f59e0b → #d97706` | `#fbbf24` |
  | Block | `#475569 → #334155` | `#94a3b8` |
- **Accent colors** — pink `#e74c7c` (buttons, headings), yellow `#f9ca24` (turn info, selections)
- **Font** — Segoe UI / system-ui (no external font dependencies)

---

## Client: `public/cards/index.html` (~500 lines)

Single file containing all HTML, CSS, and JavaScript (same pattern as Ludo).

### Screens (CSS class `.screen`, toggled via `.active`)
1. **`idle-screen`** — No game running. Name input, Create/Join buttons. If a lobby exists and user isn't in it, Create button is hidden (only Join shown).
2. **`lobby-screen`** — Game created, waiting for player 2. Shows player list, Start button (host only, requires 2 players).
3. **`game-screen`** — Active game. Opponent area (top), event banner, action prompt, end turn button, my area, hand (bottom).
4. **`finished-screen`** — Game over. Winner name, New Game button.

### Game Screen Layout (top to bottom)
```
┌─────────────────────────────────┐
│ Turn info (left)   Deck count   │  ← top-bar
├─────────────────────────────────┤
│ Opponent name          🃏 count │
│ [BLUE 0/3] [RED 1/3] [GRN 0/3] │  ← opp property sets
│ $2 $3                           │  ← opp bank chips
├─────────────────────────────────┤
│   fate charged huse $2 rent     │  ← event banner
├─────────────────────────────────┤
│ ┌─ Action Prompt ─────────────┐ │
│ │ Choose color / Pay rent / …  │ │  ← context-sensitive prompts
│ └─────────────────────────────┘ │
│           [End Turn]            │
├─────────────────────────────────┤
│ My name (you)         Bank: $5  │
│ [BLUE 1/3] [RED 2/3] [GRN 0/3] │  ← my property sets
│ $1 $2 $2                        │  ← my bank chips
├─────────────────────────────────┤
│ Your hand (5)                   │
│ [🏠][🏠][💵][💸][🛡️]            │  ← horizontally scrollable
└─────────────────────────────────┘
```

### Property Sets Display
- Grouped by color with label showing `COLOR X/3`
- Complete sets show `✓` and individual cards get 🔒 overlay + reduced opacity
- Mini-cards (28×38px) inside set groups with color gradient backgrounds
- **Selectable mode**: when Steal/Swap requires targeting, cards get dashed yellow outline + pulse animation

### Action Prompt System
The `action-prompt` div renders different UIs based on `state.pendingAction.type`:

| Pending Type | Who Sees It | UI |
|---|---|---|
| `wild_color` | Acting player | 3 color buttons (blue/red/green) |
| `rent_color` | Acting player | Color buttons with rent amount (`red ($2)`) |
| `steal_target` | Acting player | Opponent's property cards become selectable |
| `swap_own` | Acting player | Own property cards become selectable |
| `swap_target` | Acting player | Opponent's property cards become selectable |
| `block_prompt` | Target player | Block 🛡️ / Allow buttons |
| `block_prompt` | Acting player | "Waiting for response…" message |
| `rent_pay` | Target player | Selectable money + property cards, running total, Confirm button |
| `rent_pay` | Acting player | "Waiting for payment…" message |

### Hand Rendering
- Horizontal scrollable row of card elements (64×90px)
- Cards show icon (emoji) + label (color/value/action name)
- **Playable** when: it's your turn, turnPhase is 'playing', actionsLeft > 0, no pendingAction
- **Discarding** mode: all cards tappable, clicking discards immediately
- **Disabled** state: reduced opacity + no-pointer cursor when not your turn

### Socket.IO Connection
- Connects to namespace `/cards` (`io('/cards')`)
- Session ID stored in `localStorage` key `cards_session`
- Player name stored in `localStorage` key `cards_name` (prefilled on return)
- Emits `rejoin` on connect if session ID exists

### Client Events Emitted
| Event | Payload | When |
|---|---|---|
| `create` | `{ name }` | Create new game |
| `join` | `{ name }` | Join existing lobby |
| `start` | `sessionId` | Host starts game |
| `play_card` | `{ sessionId, cardId, color? }` | Play card from hand |
| `choose` | `{ sessionId, choice }` | Respond to action prompt |
| `end_turn` | `sessionId` | Manually end turn early |
| `discard_card` | `{ sessionId, cardId }` | Discard during hand limit phase |
| `reset` | (none) | Start new game from finished screen |

---

## Server: H♥F Deal section of `server.js`

Socket.IO namespace: `/cards` (`io.of('/cards')`)

### Constants
```javascript
const CARD_COLORS = ['blue', 'red', 'green'];
const SET_SIZE = 3;          // Cards per complete set
const SETS_TO_WIN = 3;       // Sets needed to win
const HAND_LIMIT = 7;        // Max cards in hand at end of turn
const BLOCK_TIMEOUT = 15000; // 15s for opponent to decide on Block
const CARD_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 min idle = game over
```

### Game State Object (`cardGame`)
```javascript
{
  phase: 'lobby' | 'playing' | 'finished',
  players: [
    {
      sessionId,    // UUID for reconnection
      name,         // Display name
      socketId,     // Current socket ID
      connected,    // Boolean
      hand: [],     // Cards in hand (hidden from opponent)
      properties: { blue: [], red: [], green: [] },
      bank: [],     // Money cards (visible to all)
      disconnectTimer,
    }
  ],
  deck: [],                 // Draw pile
  discard: [],              // Used cards
  currentPlayerIndex: 0|1,  // Whose turn
  actionsLeft: 0-3,         // Actions remaining this turn
  pendingAction: null|{...}, // Multi-step action state machine
  turnPhase: 'waiting'|'playing'|'discarding',
  winner: null|name,
  idleTimer, blockTimer,
  lastEvent: { type, ... }, // For event banner display
}
```

### Card Object Structure
```javascript
// Property
{ id: 0, type: 'property', color: 'blue' }

// Money
{ id: 18, type: 'money', value: 3 }

// Action
{ id: 28, type: 'action', action: 'rent'|'steal'|'swap'|'wild'|'block' }

// Wild when played (gets assignedColor)
{ id: 47, type: 'action', action: 'wild', assignedColor: 'red' }
```

### Pending Action State Machine

Actions that require multiple steps use `pendingAction` to track state:

```
Rent:   play_card → rent_color → [block_prompt →] rent_pay → resolved
Steal:  play_card → steal_target → [block_prompt →] resolved
Swap:   play_card → swap_own → swap_target → [block_prompt →] resolved
Wild:   play_card → wild_color → resolved
Block:  (reactive only — appears in block_prompt phase)
```

The `block_prompt` phase is **optional** — it only appears if the target has a Block card in hand. If they don't, the action resolves immediately (no waiting).

### State Broadcast & Privacy
`getCardState(forIdx)` builds a per-player view:
- **Your hand**: full card objects with IDs
- **Opponent's hand**: only `handCount` (integer) — cards are hidden
- Everything else (properties, bank, deck count, pending actions) is visible to both

### Rent Payment Flow (Manual)
This is the most complex interaction, designed to feel like physical card play:

1. Rent card is played → actor chooses color → block prompt (if applicable)
2. `startRentPay()` creates `pendingAction.type = 'rent_pay'` with `selectedMoney: []` and `selectedProperties: []`
3. Target player sees interactive UI: tap money/properties to toggle selection
4. Each toggle sends `choose` with `{ action: 'toggle_money'|'toggle_property', id }` — server updates selected arrays and rebroadcasts
5. Confirm button enabled when `selectedValue >= rentAmount` OR `selectedValue >= totalAssets` (can't pay more than you have)
6. On confirm: `payRentManual()` transfers specific selected cards to actor
7. Money → actor's bank; Properties → actor's property area (by color)

### Disconnect Handling
- **Lobby disconnect**: player removed from game; if empty, game reset
- **Playing disconnect**: 15-minute grace period; if expired, opponent wins by forfeit
- **Reconnect**: `rejoin` event with sessionId restores socket binding

### Socket Events (server → client)
| Event | Payload | Purpose |
|---|---|---|
| `state` | Game state object | Full state sync (sent to each player individually for hand privacy) |
| `session` | UUID string | Sent on create/join — client stores in localStorage |
| `error_msg` | String | Validation errors (full game, no lobby, etc.) |

---

## Design Pitfalls & Patterns

### The Pending Action State Machine
**This is the most fragile part of the game.** Every action card follows a multi-step flow:

1. Card removed from hand, discarded, actionsLeft decremented
2. `pendingAction` set to first phase
3. Player makes choices via `choose` events
4. Eventually `pendingAction` cleared and turn continues

**Critical rule**: `pendingAction` MUST be cleared before `endCardTurn()` or `broadcastCG()` on turn completion. If it's left dangling, the next player's turn will be broken (prompts appear for wrong player).

### Block Card Timing
Block has a 15-second server-side timer (`blockTimer`). If the target doesn't respond:
- Timer fires `resolveCardAction()` — the action proceeds as if they didn't block
- The timer is cleared in EVERY exit path from block_prompt (block chosen, allow chosen, disconnect, game reset)

**Pitfall**: If you add a new exit path from block_prompt, you MUST clear `cardGame.blockTimer` or it will fire later and corrupt state.

### Rent Payment — Why Manual, Not Automatic
The original V1 auto-deducted rent (bank first, then properties). This was changed because:
- It felt like a video game, not a card game
- In physical Monopoly Deal, choosing WHAT to pay is a strategic decision
- Sacrificing a specific property vs money is a real choice with consequences

**Pitfall**: The confirm validation checks `selectedVal >= amount || selectedVal >= maxAssets`. The second condition handles the "can't pay full amount" case — player must pay everything they have if they can't cover the rent. Without this check, a broke player could never confirm payment.

### Per-Player State Broadcasting
Unlike Ludo (which broadcasts identical state to everyone), H♥F Deal sends **different state to each player**. The `getCardState(forIdx)` function:
- Includes full `hand` array only for `forIdx` player
- Sends `handCount` for the other player
- Spectators (`forIdx = -1`) see no hands

**Pitfall**: If you add a new field to player state that should be private, you must filter it in `getCardState()`. Anything in the broadcast is visible to the client (even if the UI doesn't show it — browser devtools can).

### Lobby Screen vs Idle Screen for Non-Players
When a game exists in lobby phase, new connections receive the lobby state. The client must check `myIndex` — if `-1` (not a player), show the idle screen with Join button (not the lobby screen). The Create button is hidden since a game already exists.

**Pitfall**: The Create button must be re-shown when state returns to `idle`. This is handled in the render function: `if (state.phase === 'idle') { $('btn-create').style.display = ''; }`.

---

## Key Bug Fixes History

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| **Rent discards money instead of transferring** | `payRent()` pushed money to `cardGame.discard` instead of actor's bank | Changed to push to `actor.bank`; properties go to `actor.properties` |
| **Non-players see lobby screen, can't join** | `broadcastCG()` sends lobby state to all sockets; client rendered lobby for everyone | Client checks `myIndex < 0` → shows idle screen with Join button instead |
| **Create button missing after game reset** | Idle screen render didn't re-show Create button after it was hidden for lobby spectators | Added `$('btn-create').style.display = ''` in idle phase render |

---

## Future Enhancements (V2+)

- **Double Rent** — rare action card that doubles rent amount
- **"Steal Full Set"** — ultra-rare card that can steal a complete set
- **Themed sets** — cities, perfumes, etc. with different set sizes
- **Short mode** — 2 sets to win instead of 3
- **Sound effects** — card play, rent charge, block sounds
- **Card animations** — deal, play, transfer animations
- **Game history/log** — scrollable event log showing all actions
- **Rematch button** — quick restart without going through lobby
