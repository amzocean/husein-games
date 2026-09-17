# Love in One

Love in One is a daily five-letter deduction game with three rounds per UTC calendar date.

## Daily selection

`app.js` calculates the UTC day offset from September 17, 2026 and selects the corresponding consecutive triplet from `puzzles.js`. The 30-entry catalog provides ten days without repeated answers, then repeats from the beginning.

Each puzzle entry contains:

- `answer`: the five-letter solution
- `clue`: a valid five-letter starter word shown with completed feedback
- `definition`: displayed after solving
- `sentence`: a romantic, cute, or Fatema-focused example displayed after solving

Add entries to `puzzles.js` in complete groups of three to extend the schedule. Answers and clues must contain exactly five A-Z letters. Every clue must provide at least two right-place letters, one wrong-place letter, and one absent letter.

## Rules

- The scored clue row is provided automatically.
- Correct-position, wrong-position, and absent feedback use rose, gold, and slate with visible symbols.
- Players have unlimited guesses and can move freely among the three daily rounds.
- Progress is stored in `localStorage` under `love-in-one:v2:YYYY-MM-DD`.
- Repeated letters are scored in two passes: exact positions first, then remaining misplaced letters.

## Dictionary

`words.js` contains the five-letter subset of `an-array-of-english-words` 2.0.0. Its MIT license is preserved in `WORDLIST-LICENSE.txt`.
