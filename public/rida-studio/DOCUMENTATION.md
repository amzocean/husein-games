# Fatema's Rida Studio — `public/rida-studio/`

A permanent, PIN-protected game where Fatema designs a culturally accurate
Dawoodi Bohra rida and a cheerful scene. It generates one medium-quality live
AI keepsake image per request via OpenAI's `gpt-image-2` (`images/edits`).
The result can be regenerated repeatedly with the same selections until Fatema
is satisfied.
The direct page and API are always available for testing and use. Its Game
Room card remains hidden until **September 6, 2026 UTC**, alongside the
birthday gala, and stays visible afterward.

## Flow

1. **Welcome / PIN** — Fatema enters her private PIN (`RIDA_STUDIO_PIN`).
2. **Choose base cloth** — upload a shop photo, describe the cloth, or select
   a color and pattern. The result is shared by pardi and ghagra.
3. **Choose shared design** — upload an example, describe the complete design,
   or select a panel and lace (including explicit None choices) and describe
   embroidery on/above the panel. The design is adapted to both pieces.
4. **Choose photograph** — photography treatment and location only.
5. **Review look** — a summary of every selection before generation.
6. **Generate + play** — while the server creates the first candidate, the loading
   card offers **Pattern Atelier**, an untimed sequence-memory game. Six
   jewel-like tiles display an increasingly long pattern for Fatema to repeat.
   Correct rounds increase score and combo, mistakes consume one of three
   lives and replay the same pattern, and the game can be restarted without
   limit. It is entirely local and never interrupts or duplicates the API
   request. An elapsed-status line explains the generation phase. OpenAI
   requests have a four-minute server timeout, after which the UI returns to
   Review with a retry message.
7. **Results** — the candidate is immediately downloadable. Fatema can
   repeatedly replace it with a fresh candidate using the same requirements,
   or use "make another look" to return to the design flow.

Descriptions are sanitized and capped at 300 characters. Input precedence is
upload first, description second, curated options third.

Color, motif, panel, and border now default to **Surprise Me**. When Fatema
leaves those defaults in place, the server asks for a fresh combination for
each candidate rather than silently choosing the first catalog design.
Identity-reference clothing is explicitly excluded as a garment-design source,
so the light-blue rida in the primary face reference cannot become the default.
Explicit uploads, descriptions, and selected options still take precedence.

An uploaded base image is the first and highest-priority visual reference.
Literal fabric photos are matched as closely as generation permits. A
non-fabric source such as artwork, packaging, or an advertisement has its
colors, non-text shapes, and visual rhythm transformed into a repeatable
textile pattern; words, logos, faces, and products are not copied. Upload-based
requests use the primary identity photo plus three distributed supporting
views instead of all ten identity photos, reducing competition from reference
clothing while retaining Fatema's identity.

When uploads are used, reference ordering is deliberately optimized for image
fidelity: the base cloth is first, the optional tailoring design is next, and
the reduced identity-reference set follows.
The locked prompt treats the uploaded cloth as mandatory and requires its exact
colors, print, motif scale, spacing, weave, sheen, and texture to remain clearly
visible across both pardi and ghagra in both generated candidates.

## Files

```
public/rida-studio/
  index.html          Multi-screen single-page UI (welcome → rida → scene → review → loading → results)
  style.css           Mobile-first, vibrant/cheerful styling
  app-v6.js           Screen state machine + fetch calls to /rida-studio/api/*
  DOCUMENTATION.md    This file

lib/ridaStudio/        Server-side logic, mounted by the root server.js
  options.js            Curated color, motif, panel, lace, photography, and location catalog
  promptBuilder.js       Locked prompt template + bounded description handling
  identity.js             Reference-photo resolution (RIDA_REFERENCE_PHOTOS env, or local .birthday-studio/rida-identity.json fallback)
  session.js               PIN login, failed-attempt lockout + opaque in-memory session tokens
  rateLimit.js               Shared cross-studio concurrency guard
  router.js                  Express router: /login, /logout, /session, /options, /generate
  selftest.js                 Self-test suite (see below) — never calls OpenAI

lib/shared/             Production photo-validation and OpenAI helpers
  tilesPhotos.js          Tiles-photo allowlist/path-traversal validation
  openaiImagesClient.js    OpenAI images/edits caller (no SDK dependency)
```

Production `server.js` mounts the API with:

```js
const ridaStudioRouter = require('./lib/ridaStudio/router');
app.use('/rida-studio/api', ridaStudioRouter.createRouter());
```

The static UI in this folder is served automatically by the existing
`express.static(path.join(__dirname, 'public'))` middleware — no special
route is needed for `index.html`/`style.css`/`app-v6.js`.

## Required environment variables (production / Render)

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes (to generate) | OpenAI API key. Never exposed to the browser, never logged. |
| `RIDA_STUDIO_PIN` | Yes | Fatema's private PIN. Compared with a constant-time check; never logged or returned. |
| `RIDA_REFERENCE_PHOTOS` | Yes (to generate) | Comma-separated list of exactly 10 filenames from `public/tiles/photos/manifest.json`. **Never** returned to or chosen by the public browser. |
| `OPENAI_IMAGE_MODEL` | No | Overrides the default `gpt-image-2` model. |
| `RIDA_SESSION_SECRET` | No | Reserved for future use. Sessions are already unguessable random tokens kept in memory, so this is optional and not required for setup to work. |

If `RIDA_REFERENCE_PHOTOS` isn't set, the server falls back to reading
`.birthday-studio/rida-identity.json` (gitignored, local-only) — this is
only useful for local development/testing, since that file never exists in
a fresh Render deploy.

## Security & privacy design

1. **No secrets ever reach the browser.** `OPENAI_API_KEY` and
   `RIDA_STUDIO_PIN` are read only from `process.env` inside
   `lib/ridaStudio/`, never logged, never included in any JSON response.
2. **PIN throttling and opaque, in-memory sessions.** Five consecutive
   incorrect PIN attempts lock login for 15 minutes; a successful login
   resets the failure counter. `POST /rida-studio/api/login` compares the
   submitted PIN against `RIDA_STUDIO_PIN` with `crypto.timingSafeEqual`
   and, on success, issues a 32-byte random token stored in memory with a
   10-hour expiry. The cookie (`rida_session`) is `HttpOnly`, `SameSite=Strict`,
   scoped to `Path=/rida-studio`, and marked `Secure` whenever the request is
   HTTPS (checked via `req.secure` or `X-Forwarded-Proto`, so it works behind
   Render's proxy without needing `trust proxy`). Sessions reset if the
   Render process restarts — an accepted tradeoff for the free tier.
3. **All generation routes require authentication.** `/options` and
   `/generate` both run through `requireAuth`, which validates the session
   cookie against the in-memory map. `/generate` additionally accepts
   **JSON only**, rejects unexpected fields and unknown option values. Base
   cloth, full design, and embroidery descriptions are sanitized and capped
   at 300 characters.
4. **No daily generation limit.** A shared `generating` flag is set
   synchronously in `lib/ridaStudio/rateLimit.js` before calling OpenAI, so
   two near-simultaneous requests across Rida Studio and Photo Studio can
   never both proceed; the second gets an explicit `409`.
5. **Identity references never reach the browser.** `RIDA_REFERENCE_PHOTOS`
   (or the local fallback file) is resolved only on the server, inside the
   `/generate` handler, and every filename is re-validated against
   `public/tiles/photos/manifest.json` via the same allowlist/path-traversal
   guard used by the local tool (`lib/shared/tilesPhotos.js`). No API
   response ever includes these filenames.
6. **Reference uploads are ephemeral.** The browser downsizes base-cloth and
   design-example photos to at most 1600px and sends them only with Generate. The server
   validates its MIME type, signature, base64 encoding, and 5MB decoded-size
   cap, then appends it after the ten identity references. It is never
   written to disk or returned in a response.
7. **No server-side storage of generated images.** The two images are
   returned to the browser as base64 in the JSON response and rendered/
   downloaded client-side; nothing is written to disk, and nothing is
   logged.
8. **Explicit `no-store` headers** (`Cache-Control: no-store`, `Pragma:
   no-cache`) are set on every response from this router, including
   login/session/generate.
9. **Automated response-shape checks** in `lib/shared/openaiImagesClient.js`
   verify the OpenAI response contains exactly the requested number of
   images, each with valid `b64_json` data, before anything is returned to
   the browser. There is no additional (paid) vision-review call in this
   version — see the Cultural/UX section below for why the UI never
   promises a guaranteed likeness.

## Locked prompt design (`lib/ridaStudio/promptBuilder.js`)

The browser only ever sends short option **keys** (e.g. `color: "rosePearl"`).
The server resolves those keys against the fixed catalog in `options.js` and
assembles the final prompt from an **immutable** template that always
includes:

- An explicit definition of an authentic Dawoodi Bohra rida: a stitched,
  coordinated two-piece **pardi** with full-length sleeves and an integrated
  headpiece covering hair, neck, shoulders, arms, and torso; its face flap is
  folded aside so the whole face stays visible. The matching **ghagra** is an
  ankle-length, mostly straight skirt with modest ease and a gentle A-line.
- Silhouette guidance grounded in the selected real photos: the pardi uses a
  shallow gathered yoke and controlled trapezoidal drape; the ghagra is
  mostly straight/column-like with only a gentle A-line. Standing hems remain
  modestly wider than the hips, while seated fabric follows the knees and
  shins without fanning, pooling, trains, or ball-gown volume.
- An explicit forbidden-alternatives clause: no sari, lehenga/cropped choli,
  abaya, burqa, niqab, generic hijab, western gown/dress, face covering,
  exposed hair/neck/arms/midriff, fitted bodice, cinched waist, single robe,
  or unstitched drape.
- An identity-preservation clause referencing the attached photos (facial
  structure, natural complexion, approximate age, kind expression). The first
  image is the primary face reference and the other nine provide supporting
  views of the same identity.
- Every selectable visual treatment is photographic. The prompt explicitly
  rejects illustrations, paintings, cartoons, anime, chibi, 3D renders, dolls,
  generic-model beautification, enlarged eyes, and stylized facial features.
- When a cloth photo is supplied, it is explicitly separated from the first
  ten identity references and used only for its colors, print, motif scale,
  spacing, weave, sheen, and texture. It overrides catalog color/pattern
  choices and is applied across both pardi and ghagra.
- The design route applies one coordinated panel/lace/embroidery language to
  both pardi and ghagra. Lace is placed immediately below the panel when
  present; embroidery is placed on the panel or just above it.
- Full-body composition, natural hands/anatomy, and a flattering, joyful,
  tastefully romantic/cute mood appropriate for a birthday keepsake.
- An explicit safety clause: no text/logos/watermarks, no sadness/darkness/
  horror, no sexualization, no embarrassing expressions or exaggerated body
  features.
- The selected or described base cloth, shared design, photographic treatment,
  and location.

The UI is intentionally phrased around **generating and choosing a
favorite** — it never claims the output is a guaranteed likeness.

## Local setup & running

For normal Windows testing, use the local launcher:

```powershell
npm run rida-studio:local
```

On first use it securely prompts for the OpenAI key and PIN, then stores them
under `.birthday-studio/secrets/` encrypted with Windows DPAPI. The encrypted
values are readable only by the same Windows user on the same computer, and
the entire `.birthday-studio/` directory is gitignored. Later launches reuse
them without putting plaintext secrets in source, Git, command history, or a
permanent environment variable. Use
`powershell -File tools/start-rida-local.ps1 -ReplaceCredentials` to replace
either credential.

The equivalent temporary environment-variable setup is:

```powershell
cd C:\Users\huseinm\Downloads\husein-games
$env:OPENAI_API_KEY = 'sk-...'          # only for this PowerShell process
$env:RIDA_STUDIO_PIN = 'choose-a-pin'
$env:RIDA_REFERENCE_PHOTOS = 'photo-01.jpg,...exactly-10-filenames...'  # or omit to use the local fallback file
node server.js
# → http://localhost:3000/rida-studio/
```

For the configured identity pack, set `RIDA_REFERENCE_PHOTOS` directly. Local
development may instead use `.birthday-studio/rida-identity.json` containing
`{"photos":["photo-96.jpg", "... exactly 10 filenames ..."]}`.

## Self-tests

```powershell
npm run rida-studio:selftest
```

Covers: option/selection validation, locked prompt content (required +
forbidden clauses), identity resolution from both the env var and the local
fallback file (including traversal rejection, and restoring any pre-existing
local file exactly), PIN login success/failure and lockout, cookie-based auth,
logout, unauthenticated rejection, unlimited sequential generation, concurrency
rejection, the two-image response shape, and `no-store` headers — all with
a fetch guard that fails loudly if anything ever tries to reach
`api.openai.com`, and without ever reading real photo bytes (a synthetic
1×1 PNG stands in for reference photos in the HTTP-level tests).
