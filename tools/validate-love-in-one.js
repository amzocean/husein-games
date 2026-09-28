const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const DAY_MS = 86400000;
const SCHEDULE_START = Date.parse('2026-09-17T00:00:00Z');
const NEW_CONTENT_START = '2026-09-28';
const NEW_CONTENT_END = '2027-01-05';
const EXPECTED_HISTORICAL_DAYS = [
  ['BRAVE', 'CHAIR', 'CLOUD'],
  ['EARTH', 'FAITH', 'GRACE'],
  ['GRAPE', 'HEART', 'HONEY'],
  ['HOUSE', 'LIGHT', 'LUCKY'],
  ['MAGIC', 'PEACH', 'PEARL'],
  ['PLANT', 'PROUD', 'QUIET'],
  ['SHINE', 'SMILE', 'SPARK'],
  ['SWEET', 'TRUST', 'WORLD'],
  ['WORTH', 'APPLE', 'BEACH'],
  ['BREAD', 'CHARM', 'CREAM'],
  ['BRAVE', 'CHAIR', 'CLOUD'],
];

function scoreGuess(guess, answer) {
  const result = Array(5).fill('absent');
  const remaining = {};

  for (let index = 0; index < 5; index++) {
    if (guess[index] === answer[index]) result[index] = 'exact';
    else remaining[answer[index]] = (remaining[answer[index]] || 0) + 1;
  }

  for (let index = 0; index < 5; index++) {
    if (result[index] === 'exact') continue;
    if (remaining[guess[index]] > 0) {
      result[index] = 'present';
      remaining[guess[index]]--;
    }
  }

  return result;
}

function puzzlesForDate(puzzles, dateKey) {
  const requestedDay = Date.parse(`${dateKey}T00:00:00Z`);
  const elapsedDays = Math.floor((requestedDay - SCHEDULE_START) / DAY_MS);
  const scheduleDays = puzzles.length / 3;
  const dayIndex = ((elapsedDays % scheduleDays) + scheduleDays) % scheduleDays;
  return puzzles.slice(dayIndex * 3, dayIndex * 3 + 3);
}

function answersForDate(puzzles, dateKey) {
  return puzzlesForDate(puzzles, dateKey).map(puzzle => puzzle.answer);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loadModule(relativePath) {
  const absolutePath = path.join(__dirname, '..', relativePath);
  return import(pathToFileURL(absolutePath).href);
}

async function main() {
  const [{ PUZZLES }, { VALID_WORDS }, { NEW_PUZZLE_CONTENT, NEW_PUZZLE_CLUES }] = await Promise.all([
    loadModule('public/love-in-one/puzzles.js'),
    loadModule('public/love-in-one/words.js'),
    loadModule('public/love-in-one/expanded-puzzles.js'),
  ]);

  const dictionary = new Set(VALID_WORDS.map(word => word.toUpperCase()));

  assert.equal(PUZZLES.length % 3, 0, 'Puzzle schedule must contain complete groups of three.');
  assert.equal(PUZZLES.length, 333, 'Schedule must resolve to 333 puzzle entries.');
  assert.equal(PUZZLES.length / 3, 111, 'Schedule must resolve to 111 daily triplets.');
  assert.equal(NEW_PUZZLE_CONTENT.length, 300, 'Expansion must contain 300 content entries.');
  assert.equal(NEW_PUZZLE_CLUES.length, 300, 'Expansion must contain 300 starter clues.');

  EXPECTED_HISTORICAL_DAYS.forEach((expected, index) => {
    const dateKey = new Date(SCHEDULE_START + index * DAY_MS).toISOString().slice(0, 10);
    assert.deepEqual(
      answersForDate(PUZZLES, dateKey),
      expected,
      `Historical triplet changed for ${dateKey}.`
    );
  });

  assert.deepEqual(
    answersForDate(PUZZLES, NEW_CONTENT_START),
    PUZZLES.slice(33, 36).map(puzzle => puzzle.answer),
    'September 28 must resolve to the first new triplet.'
  );
  assert.notDeepEqual(
    answersForDate(PUZZLES, NEW_CONTENT_START),
    ['EARTH', 'FAITH', 'GRACE'],
    'September 28 must not repeat the former modulo day.'
  );
  assert.deepEqual(
    puzzlesForDate(PUZZLES, NEW_CONTENT_END),
    PUZZLES.slice(-3),
    'January 5 must resolve to the final new triplet.'
  );
  assert.deepEqual(
    answersForDate(PUZZLES, '2027-01-06'),
    EXPECTED_HISTORICAL_DAYS[0],
    'The schedule must repeat from its first triplet after January 5.'
  );

  const historicalAnswers = new Set(PUZZLES.slice(0, 33).map(puzzle => puzzle.answer));
  const newPuzzles = PUZZLES.slice(33);
  const newAnswers = newPuzzles.map(puzzle => puzzle.answer);
  assert.equal(newPuzzles.length / 3, 100, 'Exactly 100 new days must begin on September 28.');
  assert.equal(new Set(newAnswers).size, 300, 'All 300 new answers must be unique.');
  assert.deepEqual(
    newAnswers.filter(answer => historicalAnswers.has(answer)),
    [],
    'New answers must not overlap historical September 17-27 answers.'
  );

  assert.deepEqual(
    scoreGuess('ALLEY', 'APPLE'),
    ['exact', 'present', 'absent', 'present', 'absent'],
    'Repeated clue letters must not consume the same answer letter twice.'
  );
  assert.deepEqual(
    scoreGuess('PUPIL', 'QUILL'),
    ['absent', 'exact', 'absent', 'present', 'exact'],
    'Exact repeated letters must be reserved before present-letter scoring.'
  );

  PUZZLES.forEach((puzzle, index) => {
    const label = `Puzzle ${index + 1}`;
    assert.match(puzzle.answer, /^[A-Z]{5}$/, `${label} answer must be five uppercase letters.`);
    assert.match(puzzle.clue, /^[A-Z]{5}$/, `${label} clue must be five uppercase letters.`);
    assert(dictionary.has(puzzle.answer), `${label} answer ${puzzle.answer} is missing from words.js.`);
    assert(dictionary.has(puzzle.clue), `${label} clue ${puzzle.clue} is missing from words.js.`);

    const scores = scoreGuess(puzzle.clue, puzzle.answer);
    assert(
      scores.filter(score => score === 'exact').length >= 2,
      `${label} clue ${puzzle.clue} needs at least two exact letters for ${puzzle.answer}.`
    );
    assert(scores.includes('present'), `${label} clue ${puzzle.clue} needs a present letter for ${puzzle.answer}.`);
    assert(scores.includes('absent'), `${label} clue ${puzzle.clue} needs an absent letter for ${puzzle.answer}.`);

    assert.equal(typeof puzzle.definition, 'string', `${label} definition must be text.`);
    assert(puzzle.definition.trim(), `${label} definition must not be empty.`);
    assert.equal(typeof puzzle.sentence, 'string', `${label} sentence must be text.`);
    assert(puzzle.sentence.trim(), `${label} sentence must not be empty.`);
    assert(
      new RegExp(`\\b${escapeRegex(puzzle.answer)}\\b`, 'i').test(puzzle.sentence),
      `${label} sentence must contain ${puzzle.answer} as a whole word.`
    );
  });

  for (let dayIndex = 0; dayIndex < PUZZLES.length / 3; dayIndex++) {
    const dailyPuzzles = PUZZLES.slice(dayIndex * 3, dayIndex * 3 + 3);
    const dailyAnswers = new Set(dailyPuzzles.map(puzzle => puzzle.answer));
    dailyPuzzles.forEach(puzzle => {
      assert(
        !dailyAnswers.has(puzzle.clue),
        `Day ${dayIndex + 1} clue ${puzzle.clue} reveals another answer in the same triplet.`
      );
    });
  }

  console.log('Love in One validation passed.');
  console.log('Schedule: 111 days / 333 entries (September 17, 2026 through January 5, 2027).');
  console.log('Expansion: 100 days / 300 unique answers with 0 historical overlaps.');
  console.log(`September 28: ${answersForDate(PUZZLES, NEW_CONTENT_START).join(', ')}.`);
  console.log('Post-expansion behavior: January 6, 2027 repeats BRAVE, CHAIR, CLOUD.');
}

main().catch(error => {
  console.error(`Love in One validation failed: ${error.message}`);
  process.exitCode = 1;
});
