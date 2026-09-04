# Birthday Image Studio (owner-only, local-only tool)

A local, owner-only web tool for browsing Tiles photos, picking a wholesome
birthday scene/style, and generating AI-stylized candidate images with your
own OpenAI API key — for later curation into a birthday adventure/surprise
for Fatema. **Fatema never sees this tool and it never calls OpenAI live on
the site.** It is not deployed, not linked from the site, and not started by
`server.js`/Render.

## What it does

1. You pick 1–4 existing photos from `public/tiles/photos/` (via its
   `manifest.json`).
2. You pick a subject balance (Fatema solo / both together / follow the
   references), one coherent art style, one scenario, and optional uplifting
   details (balloons, flowers, cake, etc.), plus an optional short positive
   note.
3. You press **Generate**. Only then are your selected photos sent to
   OpenAI's `images/edits` endpoint using `OPENAI_API_KEY` from your own
   shell environment.
4. Candidates are saved locally under `.birthday-studio/candidates/<job-id>/`
   (gitignored — never committed).
5. You review candidates in the same page. **Approve** copies a candidate into
   `public/birthday/generated/` and records it in
   `public/birthday/generated/manifest.json` (safe to commit later when you're
   ready to build the actual surprise page). The public manifest contains only
   non-private display metadata such as style and scenario; source filenames,
   personal notes, and full prompts remain in the gitignored review folder.
   **Reject** deletes just that one candidate file.

## Rida Studio identity pack (owner-only setup for the permanent game)

This same tool also has a small **"🌸 Rida Studio identity pack"** section,
unrelated to the birthday-candidate workflow above. It exists so you (the
owner) can choose, locally, which 10 existing Tiles photos the *permanent*
production game ("Fatema's Rida Studio", at `/rida-studio/` on the live site)
should use as OpenAI identity references — without ever giving Fatema's
browser, or the public site, any way to choose or discover those filenames.

1. Select exactly 10 photos from the same photo gallery used above.
2. Press **Save identity pack**. This posts to a local-only endpoint
   (`POST /api/rida-identity`) that re-validates every filename against the
   same `public/tiles/photos/manifest.json` allowlist (rejecting traversal or
   unlisted names) and writes `.birthday-studio/rida-identity.json` atomically
   (gitignored — never committed).
3. The page then shows a copyable value such as `photo-01.jpg,photo-07.jpg,photo-12.jpg`
   — paste this into the `RIDA_REFERENCE_PHOTOS` environment variable on
   Render for the production game to use. `GET /api/rida-identity` returns
   only the configured count/filenames/timestamp — never the API key or PIN.
4. Locally (not on Render), if `RIDA_REFERENCE_PHOTOS` isn't set, the
   production game code falls back to reading this same
   `.birthday-studio/rida-identity.json` file directly, so you can test the
   full flow end-to-end without setting any extra env var on your machine.

This section is entirely local — it never calls OpenAI and never touches the
production server process directly; it only writes the one JSON file that the
production code (`lib/ridaStudio/identity.js`) knows how to read as a local
fallback.

## Running it

```powershell
cd C:\Users\huseinm\Downloads\husein-games
$env:OPENAI_API_KEY = 'sk-...'      # only for this PowerShell process
npm run birthday-studio
# → prints the exact URL, e.g. http://127.0.0.1:4173/
```

When you're done, clear the key from this shell so it doesn't linger:

```powershell
Remove-Item Env:\OPENAI_API_KEY
```

The key is **never** written to any file, never logged, and never returned in
any HTTP response — the UI only shows a boolean "configured / not configured"
status.

Optional overrides (set before `npm run birthday-studio`):
- `BIRTHDAY_STUDIO_PORT` — change the port (default `4173`).
- `OPENAI_IMAGE_MODEL` — override the image model (default `gpt-image-2`).

If `OPENAI_API_KEY` isn't set, the server still starts and the UI still works
for browsing/reviewing — pressing Generate returns a clear JSON error asking
you to set the key and restart.

## Security & privacy design

- The server binds **only** to `127.0.0.1` — never `0.0.0.0` — so it is not
  reachable from other devices on the network, let alone the internet.
- Reference photos may only come from `public/tiles/photos/`, and only
  filenames listed in its `manifest.json` are accepted — every path is
  validated against that allowlist and traversal attempts (`../`, absolute
  paths, encoded slashes) are rejected with an explicit error
  (`tools/birthday-studio/paths.js`).
- The static UI is served only from `tools/birthday-studio/public/` — no route
  serves the rest of the repository.
- Only the photos you explicitly select in the UI and press Generate on are
  ever read from disk or sent anywhere.
- Candidate counts and reference-photo counts are capped at 1–4 to bound cost
  per Generate click.
- There is no freeform prompt box. All wording comes from a curated
  scenario/style/detail list; the only free text is a short (≤200 char)
  optional note that is sanitized (stripped of control/markup characters) and
  folded into a fixed, safety-conscious prompt template
  (`tools/birthday-studio/promptBuilder.js`) that asks for recognizable
  consistent faces, joyful/warm mood, no text/watermarks, no distorted
  anatomy, and explicitly rules out sad/dark/horror/embarrassing depictions.
  This is guidance to the model, not a guarantee — that's why curation
  (approve/reject) is part of the workflow.
- Every error path returns an explicit JSON `{ error, details? }` body that
  the UI displays — no silent failures.
- Approve/reject only ever touch the exact one candidate file named in the
  request; there is no recursive or wildcard delete anywhere in the tool.

## Files

```
tools/birthday-studio/
  server.js          Express app + 127.0.0.1-only listener, all API routes
  paths.js            Path allowlists, traversal-safe resolution helpers
  promptBuilder.js     Curated style/scenario/subject/detail options + prompt template
  openaiClient.js       Calls OpenAI images/edits (delegates to lib/shared/openaiImagesClient.js)
  store.js              Job/candidate metadata, approve/reject/atomic manifest writes
  identityStore.js       Rida Studio identity-pack save/load (owner-only setup)
  selftest.js            Self-test suite (see below)
  public/                 Browser UI (index.html, app.js, style.css)

.birthday-studio/candidates/<job-id>/    Working data — gitignored, never committed
.birthday-studio/rida-identity.json       Rida Studio identity-pack config — gitignored, never committed
public/birthday/generated/                Approved exports + manifest.json — safe to commit later
```

## Self-tests

```powershell
npm run birthday-studio:selftest
```

Covers prompt construction and its safety language, manifest/path allowlist
validation (including traversal rejection), the `/api/generate` missing-key
error path, explicit 404s/400s, an approve/reject round-trip using a tiny
synthetic 1×1 PNG (not a real photo) that is cleaned up afterwards, and the
Rida Studio identity-pack endpoints (invalid count, traversal/unlisted
photos, save/load round-trip). The suite backs up any real pre-existing
`.birthday-studio/rida-identity.json` before its tests and restores it
byte-for-byte afterward. The suite never calls OpenAI (a fetch guard fails
the test loudly if it ever tried) and never reads real photo bytes beyond
the manifest listing.
