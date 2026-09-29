# Better Half

Better Half is a daily five-letter deduction game that begins each puzzle with a completed clue—a loving head start rather than a blank board. Its core line is **“I’ll meet you halfway.”**

The public route remains `/love-in-one/`, the validation command remains `npm run love-in-one:validate`, and saved progress remains under the existing `love-in-one:v2` key. These implementation identifiers are intentionally unchanged to preserve bookmarks, deployment routing, tooling, and player progress.

## Daily selection

`app.js` calculates the UTC day offset from September 17, 2026 and selects the corresponding consecutive triplet from the resolved `PUZZLES` array in `puzzles.js`.

The explicit schedule contains 111 UTC days and 333 entries:

- September 17-26, 2026: the ten original daily triplets
- September 27, 2026: the historical modulo result, explicitly preserved as `BRAVE`, `CHAIR`, `CLOUD`
- September 28, 2026-January 5, 2027: 100 consecutive new daily triplets

September 28 begins with `ADORE`, `BLOOM`, `COMFY`. After the final new triplet on January 5, the existing modulo behavior continues across the complete 111-day schedule. January 6, 2027 therefore wraps to `BRAVE`, `CHAIR`, `CLOUD`.

Each puzzle entry contains:

- `answer`: the five-letter solution
- `clue`: a valid five-letter starter word shown with completed feedback
- `definition`: displayed after solving
- `sentence`: a romantic, cute, or Fatema-focused example displayed after solving

The original entries and explicit September 27 repeat are assembled in `puzzles.js`. New prose content is stored in `expanded-puzzles.js` as inspectable `[answer, definition, sentence]` tuples, with its corresponding deterministic clue list beside it.

To extend the schedule:

1. Add content to `NEW_PUZZLE_CONTENT` in complete groups of three.
2. Add one matching clue per entry to `NEW_PUZZLE_CLUES`.
3. Keep every answer unique within the expansion and distinct from all historical answers.
4. Use exactly five A-Z letters for answers and clues, and ensure both appear in `words.js`.
5. Give every clue at least two right-place letters, one wrong-place letter, and one absent letter under the game's two-pass repeated-letter scoring.
6. Provide a concise definition and a natural sentence containing the answer as a whole word.
7. Update the expected schedule totals and end date in `tools/validate-love-in-one.js` and this document.

Run the complete data validation from the repository root:

```powershell
npm run love-in-one:validate
```

The validator resolves the shipped 333-entry browser catalog and verifies schedule grouping, the exact September 17-27 answer triplets, the 100-day date range, dictionary membership, clue feedback (including repeated letters), same-day clue anti-spoilers, nonempty prose, whole-word sentence usage, 300 unique new answers, and zero overlap with historical answers.

## Rules

- The scored clue row is provided automatically.
- Correct-position, wrong-position, and absent feedback use familiar Wordle-style green, yellow, and gray with visible symbols, surrounded by the soft romantic Better Half treatment.
- Players have unlimited guesses and can move freely among the three daily rounds.
- Progress is stored in `localStorage` under `love-in-one:v2:YYYY-MM-DD`.
- Repeated letters are scored in two passes: exact positions first, then remaining misplaced letters.

## Text-to-Speech (TTS) Voice Narration

Love in One includes AI voice narration using **Fish Audio S2 Pro** voice cloning. When a player solves a puzzle, they can click the **"🔊 Hear it"** button on the answer card to hear the definition and sentence read aloud in a cloned voice.

### Setup

#### 1. Obtain Fish Audio API Credentials

1. Create a [Fish Audio](https://fish.audio) account
2. Subscribe to the S2 Pro model ($5.50/month)
3. Add API credits to your account (recommended: $10–20 for batch generation)
4. Copy your **API Key** from the account dashboard (format: `sk-fish-...`)

#### 2. Clone Your Voice

1. Go to Fish Audio's [voice cloning interface](https://fish.audio/app/text-to-speech/)
2. Record or upload 10–30 seconds of clear audio samples of your voice
3. The system will generate a **Reference ID** (UUID format) representing your cloned voice
4. Store this Reference ID safely — you'll use it for all TTS generation

Example Reference ID: `b2260d201921415db7aa85c66a96e8cf`

#### 3. Set Environment Variables

Before generating audio, configure your local environment:

```powershell
# PowerShell
$env:FISH_AUDIO_API_KEY = "sk-fish-YOUR_API_KEY_HERE"
$env:FISH_AUDIO_VOICE_ID = "YOUR_REFERENCE_ID_HERE"
```

Or add to your system environment variables permanently for production deployments.

### Generating Audio Files

#### Batch Generation Script

Use `tools/generate-tts-batch.js` to generate audio files for all 333 puzzles:

```powershell
cd C:\Users\huseinm\Downloads\husein-games
$env:FISH_AUDIO_API_KEY = "sk-fish-..."
$env:FISH_AUDIO_VOICE_ID = "YOUR_REFERENCE_ID"
node tools/generate-tts-batch.js
```

**Output:**
- 333 MP3 files in `public/audio/` named `sentence-0.mp3` through `sentence-332.mp3`
- `public/audio/manifest.json` with generation metadata
- Expected cost: ~$0.32 total for all sentences (at ~$0.001 per sentence)
- Expected duration: ~4 minutes (700ms rate limiting per request)

#### Pronunciation Handling: Fatema

The name "Fatema" requires phonetic respelling to ensure correct pronunciation. The script automatically replaces "Fatema" with "Faah-TAY-mah" in all sentences before sending to the Fish Audio API. This ensures the engine stresses the first syllable (Faah) and pronounces the middle syllable as "TAY" rather than the default "TUH".

**Current setting in `generate-tts-batch.js` (line 66):**
```javascript
const enhancedSentence = sentence.replace(/Fatema/g, 'Faah-TAY-mah');
```

To adjust pronunciation:
1. Test alternatives in the [Fish Audio API Playground](https://fish.audio/app/text-to-speech/)
2. Update the replacement string in `generate-tts-batch.js`
3. Re-run the batch script to regenerate audio files

### Audio Playback in the Game

#### UI Integration

- **Button location:** "🔊 Hear it" button appears on the answer card after solving a puzzle
- **HTML:** `public/love-in-one/index.html` (lines 52–62)
- **Styling:** Integrated into the existing game card design with responsive spacing

#### Implementation Details

**File structure:**
- `index.html`: Defines the `<audio>` element and "Hear it" button
- `app.js`: Manages audio playback logic and file references
- `public/audio/`: Static directory serving all 333 MP3 files

**Audio index calculation (app.js, lines 270–276):**
```javascript
const puzzleIndex = dayIndex * 3 + state.current;
const audioFile = `audio/sentence-${puzzleIndex}.mp3`;
answerAudio.src = audioFile;
```

This ensures the correct audio file matches the puzzle displayed on screen.

**Playback flow:**
1. Player solves a puzzle and views the answer card
2. Player clicks "🔊 Hear it" button
3. JavaScript calculates the correct puzzle index: `dayIndex * 3 + currentRound` (0–2)
4. Audio element loads `public/audio/sentence-{index}.mp3`
5. Browser plays the MP3 via the native HTML5 `<audio>` API

### Cost Analysis

**Fish Audio S2 Pro pricing:**
- Monthly subscription: $5.50/month (includes 250K credits)
- API credits: Sold separately (typically $0.50–$5.00 per 10K credits)
- Per-request cost: ~$0.001 per sentence (varies by length)

**Love in One batch generation cost:**
- 333 sentences at ~$0.001 each = ~$0.33 total
- Monthly narration costs are negligible if using bundled subscription credits

### Regenerating Audio

If you need to regenerate audio (e.g., after adjusting pronunciation or adding new puzzles):

```powershell
# Option 1: Clear old files and regenerate all
rm -r public/audio
mkdir public/audio
node tools/generate-tts-batch.js

# Option 2: Script will skip existing files—just re-run for new puzzles
node tools/generate-tts-batch.js
```

The script uses a manifest (`public/audio/manifest.json`) to track generated files. Check the manifest to see which files were skipped vs. generated.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| **Audio mismatch** (wrong puzzle audio plays) | Verify puzzle index calculation in `app.js` line 270. Check that all 333 audio files exist. |
| **Wrong voice** (audio uses default voice, not cloned) | Ensure `reference_id` (not `voice_id`) is set in API request. Verify environment variable is correct. |
| **Pronunciation incorrect** | Test alternative phonetic spellings in [Fish Audio Playground](https://fish.audio/app/text-to-speech/). Update `generate-tts-batch.js` line 66 and regenerate. |
| **HTTP 402: Insufficient credits** | Add API credits to your Fish Audio account. Note: Platform subscription credits are separate from API credits. |
| **Files not generating** | Check API key and Reference ID in environment variables. Verify network connection to Fish Audio API. |

## Dictionary

`words.js` contains the five-letter subset of `an-array-of-english-words` 2.0.0. Its MIT license is preserved in `WORDLIST-LICENSE.txt`.
