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

## Dictionary

`words.js` contains the five-letter subset of `an-array-of-english-words` 2.0.0. Its MIT license is preserved in `WORDLIST-LICENSE.txt`.
