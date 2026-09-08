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
2. **Choose a design path**:
   - **Complete Rida** — upload one full-rida sample photo, retain it as-is or
     request specific changes to selected parts, or describe the entire
     garment. This skips the split base-cloth and tailoring steps.
   - **Build Step by Step** — upload/describe/select the base cloth, then
     upload/describe/select the panel, lace, border, and embroidery.
3. **Interpret uploaded references** — image analysis starts immediately in
   the background. The upload slot defines intent:
   - Base Cloth extracts only the repeating fabric, even from a whole-rida photo.
   - Design extracts only ordered panels, border, piping, lace, and embroidery.
   - Complete Rida extracts the entire coordinated pardi-and-ghaghro structure.
   The UI shows the detected interpretation and accepts short, explicit
   changes, allowing a reference to be inspiration rather than an all-or-
   nothing copy.
4. **Choose photograph** — photography treatment and location while reference
   analysis continues.
5. **Review look** — a mode-aware summary before generation. The studio waits
   here only if background analysis has not finished.
6. **Generate + watch** — while the server creates the candidate, the loading
   card offers a passive **Celebration Showcase**. Fifteen messages are
   shuffled for every generation, with no immediate repeat across reshuffles.
   Animated flowers and sparkles accompany encouragement, selected
   cloth/design details, and scene information. It requires no interaction,
   concentration, score, timer, lives, or failure state. An elapsed-status
   line explains the generation phase. OpenAI requests have a four-minute
   server timeout, after which the UI returns to Review with a retry message.
7. **Results** — the candidate is immediately downloadable. Fatema can
   repeatedly replace it with a fresh candidate using the same requirements,
   returning through the Celebration Showcase while each replacement renders,
   or use "make another look" to return to the design flow.
8. **Creations library** — every result is automatically stored in IndexedDB
   on the same browser/device. The application imposes no item-count cap;
   creations load 12 at a time to keep the mobile browser responsive. Fatema
   can save any item to Photos/files, delete individual items, or delete the
   whole library. Browser storage quotas and browser-data clearing still apply.

Descriptions are sanitized and capped at 300 characters. Input precedence is
upload first, description second, curated options third.

The result **Save Photo** action uses the Web Share file flow when supported,
which exposes Save to Photos on iOS. Older iOS versions fall back to opening
the PNG in a new tab with touch-and-hold instructions. Other browsers use a
normal object-URL download instead of the unsupported large data-URL download.

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
requests use the primary identity photo plus five distributed supporting
views instead of all ten identity photos, reducing competition from reference
clothing while retaining Fatema's identity.

When uploads are used, reference ordering is deliberately optimized for image
fidelity. Complete mode puts the whole-rida photo first. Guided mode puts the
base cloth first and the optional tailoring design next. A reduced
identity-reference set follows either mode.
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
  referenceSpec.js        Strict structured rida-reference schema + prompt formatting
  referenceAnalyzer.js    Slot-aware base/design/complete image interpretation
  analysisToken.js        Signed session/role/photo binding for analyzed specifications
  identity.js             Reference-photo resolution (RIDA_REFERENCE_PHOTOS env, or local .birthday-studio/rida-identity.json fallback)
  session.js               PIN login, failed-attempt lockout + opaque in-memory session tokens
  rateLimit.js               Shared cross-studio concurrency guard
  router.js                  Express router: auth, analysis, options, and generation
  selftest.js                 Self-test suite (see below) — never calls OpenAI

lib/shared/             Production photo-validation and OpenAI helpers
  tilesPhotos.js          Tiles-photo allowlist/path-traversal validation
  openaiImagesClient.js    OpenAI images/edits caller (no SDK dependency)
  openaiVisionClient.js    OpenAI Responses image-analysis caller with strict JSON output
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
| `OPENAI_RIDA_ANALYSIS_MODEL` | No | Overrides the reference-analysis model; defaults to `gpt-5-mini`. |
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
3. **All studio data routes require authentication.** `/options`,
   `/analyze-reference`, and `/generate` run through `requireAuth`, which validates the session
   cookie against the in-memory map. `/generate` additionally accepts
   **JSON only**, rejects unexpected fields and unknown option values. Base
   cloth, full design, complete-rida, and embroidery descriptions are
   sanitized and capped at 300 characters.
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
6. **Reference uploads are ephemeral.** The browser downsizes base-cloth,
   design-example, and complete-rida photos to at most 2048px, adaptively
   recompresses them below the server's 5 MB decoded-image limit, and sends them
   first to the authenticated analysis route and later with Generate. The
   server validates MIME type, signature, base64
   encoding, and the 5MB decoded-size cap. Complete-rida or guided visual
   references are ordered before a reduced identity set so garment fidelity
   is not overwhelmed. Uploads are never written to disk.
7. **No server-side storage of generated images.** Each image is
   returned to the browser as base64 in the JSON response and rendered/
   downloaded client-side; nothing is written to disk, and nothing is
   logged.
8. **Explicit `no-store` headers** (`Cache-Control: no-store`, `Pragma:
   no-cache`) are set on every response from this router, including
   login/session/generate.
9. **Structured reference interpretation.** `referenceAnalyzer.js` uses the
   upload slot as a mandatory semantic role and returns a strict schema:
   source type, base-cloth relationship, base cloth, exact top-to-bottom design
   layers, per-layer vertical size, embroidery above the lower design, and a
   user-facing summary.
   Worn-rida photos discard the sample wearer and setting. Base-cloth uploads
   discard trim; design uploads discard base cloth; complete uploads retain
   both. The validated specification and optional user correction accompany
   the original photo in the locked generation prompt. The server returns a
   signed opaque token binding the specification to the authenticated session,
   upload role, exact photo digest, and expiry; `/generate` reconstructs the
   trusted specification only after verifying that token. The browser cancels
   obsolete analysis when a photo is replaced. The server permits at most two
   different roles per session and three analysis calls process-wide. If the
   login session changes, retained photos are analyzed again automatically so
   their tokens bind to the new authenticated session.

For layers assigned to both pieces, generation must repeat the complete stack
independently at the bottom of the pardi and again at the bottom of the
ghaghro. Layers cannot be distributed between pieces or expanded into the
base cloth. Structured sizes distinguish 1–3 inch trim, 3–5 inch narrow
elements, 6–8 inch standard panels, and 8–10 inch broad panels.
10. **Automated response-shape checks** in `lib/shared/openaiImagesClient.js`
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
  structure, natural complexion, approximate age, kind expression, natural
  body build, and body proportions). Fatema is explicitly fixed at **5 feet
  10 inches / 178 cm** and naturally tall; the prompt forbids making her
  shorter, petite, thinner, narrower, heavier, taller, younger, or changing
  torso, shoulder, arm, or leg proportions.
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
- Standard panels are constrained to **6–8 inches** of vertical height and
  broad/wide panels to **8–10 inches**, scaled relative to Fatema's 5'10"
  height. Panels must never expand into an oversized quarter-skirt section.
- Complete-rida mode treats one uploaded sample as the whole-garment source:
  cloth, print, panel, lace, border, embroidery, embellishments, and pardi/
  ghagra coordination. The sample's person, face, body, pose, and background
  are explicitly ignored. A complete written description supplies the same
  whole-garment specification without an image.
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
rejection, the one-image response shape, and `no-store` headers — all with
a fetch guard that fails loudly if anything ever tries to reach
`api.openai.com`, and without ever reading real photo bytes (a synthetic
1×1 PNG stands in for reference photos in the HTTP-level tests).
