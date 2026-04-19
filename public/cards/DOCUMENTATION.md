# H♥F Deal — Developer Documentation

> **Parent doc**: [../../DOCUMENTATION.md](../../DOCUMENTATION.md) (project-wide architecture, deployment, common tasks)

---

## Overview

A 2-player card game inspired by Monopoly Deal (but simplified, copyright-free). Players collect property sets, bank money, and play action cards (Rent, Steal, Swap, Wild, Block, Pass Go, Debt Collector, Birthday, Double Rent, Deal Breaker). First to complete **3 full property sets** wins. Built for quick 15-20 minute sessions over a call.

**Why "H♥F Deal" instead of "Monopoly Deal"?**
Monopoly is a Hasbro trademark. The mechanics (collect sets, charge rent, steal) are not copyrightable — only the name and branding are. "H♥F Deal" uses the same core gameplay loop but with a simplified ruleset and original card design.

---

## Game Rules (V2)

### Objective
First player to complete **3 full property sets** wins. Set sizes vary by color (see table below).

### Components

| Card Type | Count | Details |
|-----------|-------|---------|
| Property (Blue) | 4 | Needs **2** for a set |
| Property (Red) | 6 | Needs **3** for a set |
| Property (Green) | 4 | Needs **3** for a set |
| Property (Yellow) | 6 | Needs **3** for a set |
| Property (Black) | 5 | Needs **2** for a set |
| Money ($1-$10) | 11 | Values: 1×3, 2×3, 3×2, 5×2, 10×1 |
| Rent | 6 | Charge opponent rent based on RENT_TABLE |
| Steal | 5 | Take 1 property from opponent's incomplete set |
| Swap | 4 | Exchange 1 property with opponent |
| Wild | 4 | Plays as any color property |
| Block | 4 | Cancel any action played against you |
| Pass Go | 4 | Draw 2 extra cards ($1 bank value) |
| Debt Collector | 3 | Force opponent to pay $5 ($3 bank value) |
| Birthday | 3 | Opponent pays $2 ($2 bank value) |
| Double Rent | 2 | Next rent card this turn does 2× damage ($1 bank value) |
| Deal Breaker | 2 | Steal an opponent's complete set ($5 bank value) |
| **Total** | **77** | |

### Set Sizes & Rent Table

| Color | Set Size | Rent by Card Count (1/2/3) |
|-------|----------|---------------------------|
| Blue | 2 | $3 / $8 / — |
| Red | 3 | $2 / $3 / $6 |
| Green | 3 | $2 / $4 / $7 |
| Yellow | 3 | $2 / $3 / $6 |
| Black | 2 | $3 / $8 / — |

### Turn Flow
1. **Draw 2 cards** (automatic; draw **5** if hand is empty at turn start)
2. **Play up to 3 actions** — any combination of:
   - Play a property card to your area
   - Bank a money card
   - Play an action card (Rent, Steal, Swap, Wild, Pass Go, etc.)
   - Bank an action card for its $ value (choice popup appears)
3. **End turn** (manual button, or auto after 3 actions)
4. **Discard** down to 7 if over hand limit

### Key Rules
- **Complete sets are protected** from Steal and Swap, but **CAN be sacrificed** to pay debts (rent, Debt Collector, Birthday) and **CAN be taken** by Deal Breaker
- **Variable rent** — rent amounts follow the `RENT_TABLE` per color (not just card count)
- **Rent payment is manual** — target player selects which money/properties to give up from their table (bank + all properties including complete sets). Payment does NOT come from hand.
- **Confirmation popups** — all card plays require confirmation (property: "Play BLUE property?", money: "Bank $5?", action cards: "Use as Action / Bank for $X / Cancel"). Discard also confirms before removing.
- **Block** is reactive only — can only be played when an action targets you (15-second timer). Block works against: Rent, Steal, Swap, Debt Collector, Birthday, Deal Breaker.
- **Wild cards** — player chooses color when played; tracked via `assignedColor` field
- **Pass Go** — draw 2 extra cards immediately; can be banked for $1 instead
- **Double Rent** — play **before** a Rent card; the next rent this turn is doubled (uses 1 play action). Requires at least 2 actions remaining (so you can play both Double Rent + Rent). Card displays "(Play BEFORE Rent)" hint. When active, rent cards in hand glow gold and rent color buttons show `2×` amounts.
- **Debt Collector** — force opponent to pay $5; can be blocked; can be banked for $3
- **Birthday** — force opponent to pay $2; can be blocked; can be banked for $2
- **Deal Breaker** — steal an entire complete set from opponent; can be blocked; can be banked for $5
- **Bank value on action cards** — when playing an action card, a popup offers "Use Action" or "Bank for $X"
- **Empty deck** — discard pile is reshuffled; if both empty, draw fewer cards
- **Hand limit** — max 7 cards; must discard excess at end of turn

---

## Visual Theme — Physical Card Game Aesthetic
- **Dark green felt table** — background `#1a5c2c` with radial highlight + subtle diagonal stripe texture, simulating a real card game table
- **Color palette**:
  - Text: Cream `#f0ebe3` (primary), Gold `#f0c040` / `#e8c170` (secondary, accents)
  - Player name: Green `#4ade80`, Opponent name: Gold `#e8c170`
  - Areas: Semi-transparent dark panels `rgba(0,0,0,0.15)` with `rgba(255,255,255,0.06)` borders
- **Card colors** — gradient backgrounds per type (unchanged from V1):
  | Type | Gradient | Border |
  |------|----------|--------|
  | Blue property | `#60a5fa → #2563eb` | `#93c5fd` |
  | Red property | `#f87171 → #dc2626` | `#fca5a5` |
  | Green property | `#4ade80 → #16a34a` | `#86efac` |
  | Yellow property | `#fde68a → #d97706` | `#fef3c7` |
  | Black property | `#4b5563 → #111827` | `#6b7280` |
  | Money | `#fcd34d → #d97706` | `#fde68a` |
  | Rent | `#c084fc → #7e22ce` | `#d8b4fe` |
  | Steal | `#f472b6 → #db2777` | `#f9a8d4` |
  | Swap | `#67e8f9 → #06b6d4` | `#a5f3fc` |
  | Wild | `#fcd34d → #c44569 → #9333ea` | `#fde68a` |
  | Block | `#cbd5e1 → #64748b` | `#e2e8f0` |
  | Pass Go | `#86efac → #16a34a` | `#bbf7d0` |
  | Debt Collector | `#fda4af → #be123c` | `#fecdd3` |
  | Birthday | `#fbcfe8 → #db2777` | `#f9a8d4` |
  | Double Rent | `#fef08a → #ca8a04` | `#fef9c3` |
  | Deal Breaker | `#f87171 → #991b1b` | `#fca5a5` |
- **Set labels** — brightened for dark background: blue `#60a5fa`, red `#f87171`, green `#4ade80`, yellow `#fbbf24`, black `#94a3b8`
- **Card backs** — pink/maroon gradient (`#c44569 → #8b1a3a`) with `♥` watermark, displayed as overlapping fan (`-10px` margin) in opponent's table area to show their hand count
- **Bank chips** — circular gold coins with metallic gradient (`#f0c040 → #d4a030`), `$` prefix, border `#e8b830`
- **Hand cards** — fan overlap layout (`-8px` margin, expand on hover), enhanced 3D drop shadows, Double Rent glow effect on rent cards when `doubleRentActive`
- **Top bar** — fixed deck info display (cards remaining + 🃏 icon) at top-right
- **Font** — Segoe UI / system-ui (no external font dependencies)
- **Animations** — card entrance, event banner slide, set completion glow, confetti on win, hover expand on hand cards
- **Sound effects** — Web Audio API synthesizer with 10 event sounds + mute toggle (top-right)

---

## Client: `public/cards/index.html` (~1100 lines)

Single file containing all HTML, CSS, and JavaScript (same pattern as Ludo).

### Screens (CSS class `.screen`, toggled via `.active`)
1. **`idle-screen`** — No game running. Name input, Create/Join buttons. If a lobby exists and user isn't in it, Create button is hidden (only Join shown).
2. **`lobby-screen`** — Game created, waiting for player 2. Shows player list, Start button (host only, requires 2 players).
3. **`game-screen`** — Active game. Fixed-height viewport (`100vh`) with: top-bar, scrollable middle (opponent area → event banner → turn info → prompt → my area), hand pinned at bottom.
4. **`finished-screen`** — Game over. Winner name, New Game button.

### Game Screen Layout (top to bottom)
```
┌─────────────────────────────────┐
│                     Deck: 42 🃏 │  ← top-bar (deck count, mute btn)
├─────────────────────────────────┤
│ FATE'S TABLE          7 cards   │  ← opponent header (gold, collapsible)
│ [♥♥♥♥♥♥♥]                      │  ← card backs (pink fan, shows hand count)
│ [RED 2/3 Rent $3 • Val $2]     │  ← opponent property sets
│ 💰2 💰3                         │  ← opponent bank (gold coin chips)
├─────────────────────────────────┤
│   fate charged huse $2 rent     │  ← event banner (gold, animated)
├─────────────────────────────────┤
│ Your turn — 3 plays left        │  ← centered turn info (cream text)
│ 📤 Discard to 7 (8/7)           │  ← discard status (only when over limit)
├─────────────────────────────────┤
│ ┌─ Action Prompt ─────────────┐ │
│ │ Choose color / Pay rent / …  │ │  ← context-sensitive prompts
│ └─────────────────────────────┘ │
│           [End Turn]            │  ← dark outline button
├─────────────────────────────────┤
│ MY TABLE                Bank $5 │  ← player header (green, collapsible)
│ [BLUE 1/2 Rent $3 • Val $1]    │  ← player property sets
│ 💰1 💰2 💰2                      │  ← player bank (gold coin chips)
├─────────────────────────────────┤
│ MY HAND (5)                     │  ← gold header, pinned to bottom
│ [🏠][🏠][💵][💸][🛡️][🎂][💥]    │  ← fan overlap, horizontally scrollable
└─────────────────────────────────┘
```

### Property Sets Display
- Grouped by color — **only colors the player owns** are shown (empty colors hidden)
- Label shows multi-line info: `COLOR X/Y` + `Rent $X • Value $Y` (rent = current tier amount, value = $1 per card for payment purposes)
- Complete sets show `✓` and individual cards get 🔒 overlay + reduced opacity
- Mini-cards (28×38px) inside set groups with color gradient backgrounds
- **Selectable mode**: when Steal/Swap/Deal Breaker requires targeting, cards get dashed yellow outline + pulse animation

### Action Prompt System
The `action-prompt` div renders different UIs based on `state.pendingAction.type`:

| Pending Type | Who Sees It | UI |
|---|---|---|
| `wild_color` | Acting player | 5 color buttons (blue/red/green/yellow/black) |
| `rent_color` | Acting player | Color buttons with rent amount (`red ($3)`) — shows 2× if Double Rent active |
| `steal_target` | Acting player | Opponent's property cards become selectable |
| `swap_own` | Acting player | Own property cards become selectable |
| `swap_target` | Acting player | Opponent's property cards become selectable |
| `dealbreaker_target` | Acting player | Color buttons for opponent's complete sets |
| `block_prompt` | Target player | Block 🛡️ / Allow buttons |
| `block_prompt` | Acting player | "Waiting for response…" message |
| `rent_pay` | Target player | Selectable money + property cards (including complete sets), running total, Confirm button |
| `rent_pay` | Acting player | "Waiting for payment…" message |

### Confirmation Popups
All card plays require confirmation to prevent accidental taps while scrolling:

| Card Type | Popup Content | Buttons |
|---|---|---|
| Property | "Play BLUE property?" | ✅ Play / Cancel |
| Money | "Bank $5?" | ✅ Bank / Cancel |
| Action | Choice popup | Use as Action / Bank for $X / Cancel |
| Discard | "Discard BLUE property?" | 🗑️ Discard / Cancel |

Popups are fixed overlays with centered boxes. Dismissed by Cancel button or clicking backdrop.

### Hand Rendering
- Fan overlap layout — cards use `-8px` margin overlap, expand on hover with smooth transition
- Cards show icon (emoji) + label (color/value/action name); multi-word labels use line breaks (e.g., "Debt\nCollector")
- Property cards also show rent tier amounts at the bottom
- Enhanced 3D drop shadows for physical card depth
- **Double Rent glow**: when `doubleRentActive` is true, all Rent cards in hand get a pulsing gold glow (`dbl-rent-glow` class) to remind player to play rent next
- **Double Rent hint**: Double Rent cards display "(Play BEFORE Rent)" subtitle text
- **Playable** when: it's your turn, turnPhase is 'playing', actionsLeft > 0, no pendingAction
- **Discarding** mode: all cards tappable, clicking shows discard confirmation popup, then discards on confirm
- **Disabled** state: reduced opacity + no-pointer cursor when not your turn

### Opponent Hand Display
- Card backs (pink/maroon gradient with `♥` watermark) rendered in a fan layout inside opponent's table area
- Count matches `opp.handCount` from server state (capped at 12 visually)
- Text label also shows exact count (e.g., "7 cards")

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
const CARD_COLORS = ['blue', 'red', 'green', 'yellow', 'black'];
const SET_SIZES = { blue: 2, red: 3, green: 3, yellow: 3, black: 2 };
const RENT_TABLE = {
  blue:   { 1: 3, 2: 8 },
  red:    { 1: 2, 2: 3, 3: 6 },
  green:  { 1: 2, 2: 4, 3: 7 },
  yellow: { 1: 2, 2: 3, 3: 6 },
  black:  { 1: 3, 2: 8 },
};
const PROP_COUNTS = { blue: 4, red: 6, green: 4, yellow: 6, black: 5 };
const BANK_VALUES = {
  rent: 1, steal: 3, swap: 3, wild: 0, block: 4, passgo: 1,
  debtcollector: 3, birthday: 2, doublerent: 1, dealbreaker: 5,
};
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
      properties: { blue: [], red: [], green: [], yellow: [], black: [] },
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
  doubleRentActive: false,    // True if Double Rent was played this turn
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

// Action (basic)
{ id: 28, type: 'action', action: 'rent'|'steal'|'swap'|'wild'|'block' }

// Action (with bank value)
{ id: 55, type: 'action', action: 'passgo'|'debtcollector'|'birthday'|'doublerent'|'dealbreaker', bankValue: 1-5 }

// Wild when played (gets assignedColor)
{ id: 47, type: 'action', action: 'wild', assignedColor: 'red' }
```

### Pending Action State Machine

Actions that require multiple steps use `pendingAction` to track state:

```
Rent:          play_card → rent_color → [block_prompt →] rent_pay → resolved
Steal:         play_card → steal_target → [block_prompt →] resolved
Swap:          play_card → swap_own → swap_target → [block_prompt →] resolved
Wild:          play_card → wild_color → resolved
Block:         (reactive only — appears in block_prompt phase)
Pass Go:       play_card → draw 2 → resolved (immediate)
DebtCollector: play_card → [block_prompt →] rent_pay($5, no color) → resolved
Birthday:      play_card → [block_prompt →] rent_pay($2, no color) → resolved
Double Rent:   play_card → set doubleRentActive → resolved (immediate)
Deal Breaker:  play_card → dealbreaker_target → [block_prompt →] steal set → resolved
```

The `block_prompt` phase is **optional** — it only appears if the target has a Block card in hand. If they don't, the action resolves immediately (no waiting).

### State Broadcast & Privacy
`getCardState(forIdx)` builds a per-player view:
- **Your hand**: full card objects with IDs
- **Opponent's hand**: only `handCount` (integer) — cards are hidden
- Everything else (properties, bank, deck count, pending actions, doubleRentActive, setSizes, rentTable) is visible to both

### Rent / Debt Payment Flow (Manual)
This is the most complex interaction, designed to feel like physical card play. This same flow is used for Rent, Debt Collector, and Birthday cards.

1. Action card is played → (for Rent: actor chooses color) → block prompt (if applicable)
2. `startRentPay()` creates `pendingAction.type = 'rent_pay'` with `selectedMoney: []` and `selectedProperties: []`. The `color` field is the rent color for Rent cards, or `null` for Debt Collector/Birthday.
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
| **Swap card: can't select own property** | `renderGame()` overwrites `my-sets` with `selectable=false` after `renderPrompt()` already set `selectable=true` for swap_own | Skip non-selectable re-render of my-sets when `swap_own` is the active pending action |
| **Double Rent played after Rent (wrong order)** | UX confusion — no indication that Double Rent must be played BEFORE Rent | Added "(Play BEFORE Rent)" hint on card, gold glow on rent cards when active, `actionsLeft >= 2` server validation |

---

## Future Enhancements (V3+)

- **Just Say No chaining** — allow counter-blocking (Block vs Block chains)
- **Color-paired rents** — rent cards tied to specific color pairs (like real Monopoly Deal)
- **Two-color wildcards** — wild cards that count as one of two colors
- **House/Hotel** — upgrade complete sets for higher rent
- **Property overflow** — handle extra properties beyond set size
- **Short mode** — 2 sets to win instead of 3
- **Game history/log** — scrollable event log showing all actions
- **Rematch button** — quick restart without going through lobby
