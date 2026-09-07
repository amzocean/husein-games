# Fatema's Photo Studio

Fatema's Photo Studio is a private AI portrait generator at `/photo-studio/`.
The direct URL and API are always available. Its Game Room card remains hidden
until September 6, 2026 UTC and stays visible afterward.

## Experience

1. Enter the same private PIN used by Rida Studio.
2. Describe a desired photograph in one text box, or start from a suggestion.
3. Generate exactly two portrait candidates.
4. Download either image or revise the description and try another scene.

The browser sends only the scene description. Ten fixed server-side identity
photos are attached to every generation and are never exposed to the browser.

## Locked generation rules

The server-controlled prompt treats Fatema's text as open-ended visual direction
for the background, mood, lighting, composition, pose, props, rida styling, and
artistic medium. It supports realistic, cinematic, dreamy, classy, cute,
storybook, illustrated, cartoon, and hand-painted animation-inspired images,
as well as playful, goofy, mischievous, dramatic, or exaggerated expressions.
Every result must:

- depict Fatema as the only person;
- preserve her identity from all ten reference photos;
- show her wearing an authentic Dawoodi Bohra rida;
- remain wholesome, modest, and recognizably Fatema in the chosen medium;
- exclude text, watermarks, collages, other people, and replacement identities.

Requests cannot override these rules.

Modesty applies to clothing and exposure only. It does not restrict Fatema's
personality, humor, facial expressions, poses, or ability to request fun and
silly images.

Named studios, franchises, characters, and living artists are converted into
general visual traits rather than copied directly. This keeps the creative
range broad without reproducing protected characters, branded worlds, or an
exact signature style.

## Shared production controls

- Environment: `OPENAI_API_KEY`, `RIDA_STUDIO_PIN`, and
  `RIDA_REFERENCE_PHOTOS`.
- Model: `gpt-image-2` unless `OPENAI_IMAGE_MODEL` overrides it.
- Output: exactly two `1024x1536` PNG images.
- Daily allowance: unlimited.
- Concurrency: only one generation may run across either studio at a time.
- PIN protection uses the same five-attempt lockout and ten-hour session
  implementation as Rida Studio.
- API responses and studio assets disable caching.

Run the offline checks with:

```bash
npm run photo-studio:selftest
```
