# Husein and Fatema's Game Room — Developer Documentation

## 1. Introduction & Project Context

This is a personal game portal built for Husein and Fatema — a romantic-themed website at **huseinlovesyou.com** that hosts 4 browser games. It's a single Node.js process (Express + Socket.IO) deployed on Render.com's free tier.

**The 4 games:**
- **💌 Valentines** — A love-letter puzzle adventure (single-player, fully static, 6 levels) → [Valentines docs](public/valentines/DOCUMENTATION.md)
- **🧩 Photo Tiles** — A pattern-matching tile puzzle with 16 procedurally-rendered SVG themes (single-player, no server logic) → [Photo Tiles docs](public/tiles/DOCUMENTATION.md)
- **🎲 Ludo** — Classic board game, 2-4 players, real-time multiplayer via Socket.IO with Canvas rendering → [Ludo docs](public/ludo/DOCUMENTATION.md)
- **🃏 H♥F Deal** — A 2-player card game (simplified Monopoly Deal), collect 3 sets to win, real-time multiplayer via Socket.IO → [H♥F Deal docs](public/cards/DOCUMENTATION.md)

**What a new session needs to know immediately:**
- The Photo Tiles game is the most actively developed — it has 16 visual themes, each requiring ~16 SVG render cases in `renderer.js` (~1870 lines). Theme work is where most bugs have occurred (see [Photo Tiles docs](public/tiles/DOCUMENTATION.md) for the Bug Fixes History and New Theme Creation Guide).
- Ludo's server logic has **5 separate code paths** that complete a token move. Any change to post-move behavior (extra turns, win checks, captures) MUST be applied to all 5. This is the #1 source of Ludo bugs (see [Ludo docs](public/ludo/DOCUMENTATION.md)).
- The site runs on Render free tier — no persistent storage, auto-deploys on push to `main`, 30s cold starts.
- Git pushes use the **browser-based credential manager** (personal GitHub account `amzocean`). The `gh` CLI is linked to a work account — do NOT use it for this repo.

## 2. Documentation Method

This document is written for **AI session continuity** — its primary audience is a fresh Copilot session picking up where the last one left off. The focus is:

- **Design decisions and their rationale** — not just what was built, but WHY this approach was chosen and what alternatives were rejected
- **Pitfalls and anti-patterns** — mistakes that were actually made in production, documented so they aren't repeated. Each bug fix entry includes the root cause analysis, not just the symptom and fix
- **Architecture constraints** — the non-obvious rules that, if violated, cause subtle bugs (e.g., the 5 code paths that must stay in sync, transient state that must be cleared after exactly one broadcast)
- **Thought process and implementation details** — code is readable on its own; this doc captures the reasoning that code can't express

When updating this documentation: don't just record WHAT changed. Record WHY, what was considered and rejected, and what a future developer would need to know to avoid breaking things.

**Documentation structure:**
| Document | Location | Covers |
|----------|----------|--------|
| This file | `DOCUMENTATION.md` | Project architecture, deployment, shared infrastructure, common tasks |
| Photo Tiles | `public/tiles/DOCUMENTATION.md` | 16-theme system, SVG rendering, new theme guide, tile bug fixes |
| Ludo | `public/ludo/DOCUMENTATION.md` | Multiplayer logic, 5 code paths, Socket.IO events, Ludo bug fixes |
| H♥F Deal | `public/cards/DOCUMENTATION.md` | Card game rules, pending action state machine, rent payment flow, bug fixes |
| Valentines | `public/valentines/DOCUMENTATION.md` | Level config, customization |

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
- **Express** serves static files from `public/` (landing page + 4 games)
- **Socket.IO** provides real-time multiplayer for Ludo (`/ludo`) and H♥F Deal (`/cards`) namespaces
- Deployed on **Render.com free tier** (spins down after 15min of no HTTP requests, ~30s cold start)

```
husein-games/
├── server.js              # Express + Socket.IO server (~595 lines)
├── package.json           # express ^4.18.2, socket.io ^4.7.4
├── .gitignore             # node_modules, package-lock.json
├── DOCUMENTATION.md       # This file — project-wide docs
├── validate-themes.js     # Pre-commit validator for tiles themes
└── public/
    ├── index.html          # Landing page with 4 game cards
    ├── valentines/         # Valentine puzzle game (static, single-player)
    │   ├── DOCUMENTATION.md
    │   ├── index.html
    │   ├── images/
    │   └── music.mp3
    ├── tiles/              # Photo tiles game (static, single-player)
    │   ├── DOCUMENTATION.md
    │   ├── index.html
    │   ├── style.css
    │   ├── app.js
    │   ├── engine.js
    │   ├── renderer.js
    │   ├── photos.js
    │   ├── photos/
    │   ├── manifest.json
    │   └── sw.js
    └── ludo/
        ├── DOCUMENTATION.md
        └── index.html
    └── cards/              # H♥F Deal card game (2-player multiplayer)
        ├── DOCUMENTATION.md
        └── index.html
```

### Key Technical Decisions
- Socket.IO namespace `/ludo` (`io.of('/ludo')` on server, `io('/ludo')` on client) — keeps Ludo traffic separate
- Socket.IO namespace `/cards` (`io.of('/cards')` on server, `io('/cards')` on client) — H♥F Deal traffic
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

## 5. Landing Page (`public/index.html`)

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
  4. **🃏 H♥F Deal** → `/cards/` (tag: Multiplayer)
- Footer: "Made with ♥ by Husein"

---

## 6. Known Issues & Limitations

1. **In-memory game state**: Render process restart loses the game. No persistence layer. Free tier can restart anytime (though Socket.IO heartbeats prevent idle shutdown while connected).

2. **Single game at a time**: Only one Ludo game and one H♥F Deal game can run globally. By design — "not very sophisticated, just have one game running at any point."

3. **No authentication**: Players identified by UUID sessionId stored in localStorage (`ludo_session` / `cards_session`). Refreshing reloads sessionId from localStorage; `visibilitychange` handles tab suspension.

4. **Winner display shows player name**: If a player names themselves "2", it shows "2 wins!" — this is correct behavior, not a bug.

---

## 7. Common Tasks

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
Server logs are prefixed with `[LUDO timestamp]` or `[CARDS timestamp]`.

### Add a new game
1. Create folder under `public/` (e.g., `public/newgame/`)
2. Add `index.html` and assets
3. Add a card to `public/index.html` in the `.games` grid
4. If it needs server-side logic, add a new Socket.IO namespace in `server.js`
5. Add a `DOCUMENTATION.md` in the game folder
6. Push to deploy

### Change Ludo timers
All constants are at the top of `server.js` (lines 20-23):
```javascript
const IDLE_TIMEOUT = 30 * 60 * 1000;      // Game ends if no turns for 30 min
const TURN_SKIP_DELAY = 1500;              // Pause before auto-skipping unmovable turn
const DISCONNECT_GRACE = 15 * 60 * 1000;   // Grace period for socket drops
const AUTO_PLAY_DELAY = 60 * 1000;         // Auto-play idle player's turn
```

---

## 8. Shared Bug Fixes History

These are project-wide bugs not specific to any single game:

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| **"Not Found" on subgame pages (Render)** | `express.static('public')` — relative path fails on Render | Changed to `path.join(__dirname, 'public')` |
| **Mobile serves stale cached HTML after deploy** | `express.static` serves HTML with default caching headers. Mobile browsers (esp. iOS Safari) aggressively cache and don't revalidate. | Added middleware BEFORE `express.static` that sets `Cache-Control: no-cache` on `.html` files and directory paths. |

> For game-specific bug fixes, see each game's documentation:
> - [Photo Tiles bug fixes](public/tiles/DOCUMENTATION.md#key-bug-fixes-history)
> - [Ludo bug fixes](public/ludo/DOCUMENTATION.md#key-bug-fixes-history)
> - [H♥F Deal bug fixes](public/cards/DOCUMENTATION.md#key-bug-fixes-history)

---

## Appendix: Original Source Locations

| Game | Original Location | Notes |
|------|-------------------|-------|
| Valentines | `C:\Users\huseinm\OneDrive - Microsoft\Documents\ValenineSite` | Copied to public/valentines/ |
| Photo Tiles | `C:\Users\huseinm\Downloads\fatema-tiles` | Copied to public/tiles/ |
| Ludo | `C:\Users\huseinm\ludo-game\` | Original standalone version (may still exist). Portal version modified for /ludo namespace. |
