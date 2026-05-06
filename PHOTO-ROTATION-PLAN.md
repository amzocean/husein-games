# Daily Photo Rotation — Plan

## Status: Phase 1 DONE ✅ | Phase 2 TODO

---

## Phase 1 — Deterministic Rotation (COMPLETED)

**What was done:**
- Replaced file-based `tiles-photo-state.json` with a deterministic date formula
- No external dependencies — pure math, survives all restarts/deploys
- Anchored: **May 4, 2026 = photo-08.jpg**, advances 1 photo per day
- Cycles through all 56 photos every 56 days
- Client sends local timezone date, server maps it to a photo
- Formula: `index = (day - ANCHOR_DAY) % 56` where ANCHOR_DAY = 20576

**Files changed:**
- `server.js` — lines ~1694-1726, `getPhotoForDate()` function + `/api/tiles/photo` endpoint
- `.gitignore` — added `tiles-photo-state.json`

**Commit:** `438ef5b` on main, auto-deployed to Render

---

## Phase 2 — Firebase Visit Tracking (TODO)

### Problem
With the deterministic formula, every date gets a photo whether someone visits or not.
We want to know which photos were **actually seen** so we can **recycle unseen photos** later.

### Goal
Track each photo served. Later, identify photos no one ever saw and feed them back into rotation.

### Design: Supabase (free tier Postgres)

**Why Supabase:**
- Free tier: 500MB Postgres, 50K rows, unlimited API requests
- Open-source Firebase alternative, very popular
- Real SQL — easy to query ("which photos were never seen?")
- Built-in dashboard to browse data visually
- Simple JS client (`@supabase/supabase-js`)
- No cold-start data loss — always-on managed Postgres

**Table: `photo_views`**
```sql
CREATE TABLE photo_views (
  id SERIAL PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,       -- '2026-05-04'
  photo TEXT NOT NULL,             -- 'photo-08.jpg'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Steps to Implement
1. Create a Supabase account at https://supabase.com (GitHub login)
2. Create a new project (free tier, choose nearest region)
3. In SQL Editor, run the CREATE TABLE above
4. Get credentials from Settings → API:
   - `SUPABASE_URL` (project URL)
   - `SUPABASE_SERVICE_KEY` (service_role key — server-side only)
5. Add both env vars to Render dashboard
6. `npm install @supabase/supabase-js`
7. Create `server/supabase.js` — initialize client (~5 lines)
8. Update `/api/tiles/photo` endpoint in `server.js`:
   - After computing the photo, upsert `{ date, photo }` to `photo_views`
   - Fire-and-forget (don't block the response)
9. Create endpoint: `GET /api/tiles/unseen-photos`
   ```sql
   SELECT filename FROM manifest
   WHERE filename NOT IN (SELECT photo FROM photo_views)
   ```
   (Compare manifest.json in JS against Supabase query results)

### Recycling Unseen Photos (Phase 3 idea)
- After one full 56-day cycle, query `photo_views` for unseen photos
- Insert them into a priority queue or modify the formula to serve them first
- Could also add a manual "force photo" admin endpoint
- SQL makes this trivial: `SELECT ... WHERE photo NOT IN (...)`

---

## Architecture Overview

```
Client (photos.js)
  │
  │  GET /api/tiles/photo?date=2026-05-04
  │
  ▼
Server (server.js)
  │
  ├─ getPhotoForDate(date) → deterministic formula → photo-08.jpg
  │
  ├─ [Phase 2] Write { date, photo } to Firestore (fire-and-forget)
  │
  └─ Response: { photo: "photo-08.jpg", index: 1, total: 56 }
```

## Notes
- Render free tier: ephemeral filesystem, 15min idle spin-down, ~30s cold start
- Client uses `new Date().toISOString().slice(0,10)` (local timezone date)
- Manifest has 56 photos: photo-07.jpg through photo-62.jpg
- Git push uses browser credential manager (GitHub account: amzocean)
- Do NOT use `gh` CLI — it's linked to work Microsoft account
