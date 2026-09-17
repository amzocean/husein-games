// puzzles.js — Love in One puzzle bank
//
// Schedule: this array is the 10-day puzzle schedule for the game. Every
// consecutive group of THREE entries (indices [0,1,2], [3,4,5], ...) forms
// one calendar day's set of three rounds, keyed to UTC days. Day 1 is
// entries 0-2, Day 2 is entries 3-5, and so on through Day 10 (entries
// 27-29). Do not reorder entries independently of their day-triplet, and
// keep each triplet's clues from spoiling the other two answers in that day.
//
// Each entry: { answer, clue, definition, sentence }
//   - answer/clue: uppercase 5-letter words, both present in words.js.
//   - clue scores against answer (Wordle-style) with at least 2 exact,
//     1 present, and 1 absent letter, so every round reveals all three
//     feedback colors before the player's first guess.
//   - definition: a concise, plain-English definition of the answer.
//   - sentence: a tender/romantic sentence that uses the answer naturally.

export const PUZZLES = [
  { answer: 'BRAVE', clue: 'BEAST', definition: 'Showing courage in the face of fear or difficulty.', sentence: 'Fatema, you are brave enough to turn every setback into a fresh beginning.' },
  { answer: 'CHAIR', clue: 'SHARD', definition: 'A seat for one person, typically with a back and four legs.', sentence: 'I always save the chair closest to mine for Fatema.' },
  { answer: 'CLOUD', clue: 'CHILD', definition: 'A visible mass of water droplets floating in the sky.', sentence: 'Even a gray cloud looks softer on days when I get to see you.' },
  { answer: 'EARTH', clue: 'TAROT', definition: 'The planet we live on, including its land, oceans, and air.', sentence: 'Of everywhere on earth, your arms are still my favorite place to be.' },
  { answer: 'FAITH', clue: 'WIDTH', definition: 'Complete trust or confidence in someone or something.', sentence: 'My faith in us only grows stronger with every year beside Fatema.' },
  { answer: 'GRACE', clue: 'GROAN', definition: 'Elegance and beauty in the way someone moves or behaves.', sentence: 'Fatema carries grace into every room she enters.' },
  { answer: 'GRAPE', clue: 'PLANE', definition: 'A small, round, juicy fruit that grows in clusters on a vine.', sentence: 'Sharing one grape between us can feel like its own little celebration.' },
  { answer: 'HEART', clue: 'RETRO', definition: 'The organ that pumps blood, often used to symbolize love.', sentence: 'My heart has belonged to Fatema since the very first hello.' },
  { answer: 'HONEY', clue: 'HEADY', definition: 'A sweet, sticky substance made by bees from flower nectar.', sentence: 'Your kindness is warmer and sweeter than honey, Fatema.' },
  { answer: 'HOUSE', clue: 'HOVEL', definition: 'A building where people live.', sentence: 'Any house turns into a home the second you walk through the door.' },
  { answer: 'LIGHT', clue: 'TIGER', definition: 'The natural energy that makes things visible; brightness.', sentence: 'You are the light that makes even my dullest mornings glow.' },
  { answer: 'LUCKY', clue: 'LOUSY', definition: 'Having good fortune; favored by chance.', sentence: 'I feel lucky every day that I get to call you mine, Fatema.' },
  { answer: 'MAGIC', clue: 'MIGHT', definition: 'A special quality that seems to create wonder beyond ordinary explanation.', sentence: 'There is real magic in the way you make ordinary days feel golden.' },
  { answer: 'PEACH', clue: 'HEADY', definition: 'A soft, sweet, fuzzy-skinned fruit with a large pit.', sentence: 'You are as sweet and gentle as a ripe peach in summer.' },
  { answer: 'PEARL', clue: 'LEASH', definition: 'A smooth, rounded gem formed inside certain oysters.', sentence: 'Fatema is the rare pearl I never stop feeling lucky to have found.' },
  { answer: 'PLANT', clue: 'STAND', definition: 'A living organism that grows in soil and usually has leaves and roots.', sentence: 'Every kind word you plant in my heart keeps blooming, Fatema.' },
  { answer: 'PROUD', clue: 'GROPE', definition: 'Feeling deep satisfaction or pleasure from an achievement or quality.', sentence: 'I could not be more proud of the woman Fatema has become.' },
  { answer: 'QUIET', clue: 'THIEF', definition: 'Making little or no noise; calm and still.', sentence: 'Even our quiet evenings together feel like the best part of my day.' },
  { answer: 'SHINE', clue: 'UNITE', definition: 'To give off or reflect a bright light.', sentence: 'Fatema does not just enter a room, she makes it shine.' },
  { answer: 'SMILE', clue: 'GLIDE', definition: 'A happy expression formed by turning up the corners of the mouth.', sentence: 'Your smile is still the best part of my entire day, Fatema.' },
  { answer: 'SPARK', clue: 'SHAKE', definition: 'A small fiery particle, or the sudden start of a strong feeling.', sentence: 'One small spark between us grew into the best story of my life.' },
  { answer: 'SWEET', clue: 'STEIN', definition: 'Having the pleasant taste of sugar; kind and endearing.', sentence: 'No dessert is as sweet as one quiet evening with you, Fatema.' },
  { answer: 'TRUST', clue: 'TAROT', definition: 'Firm belief in the reliability or honesty of someone.', sentence: 'I trust you completely, Fatema, with every part of my heart.' },
  { answer: 'WORLD', clue: 'LOWLY', definition: 'The earth together with all its people, places, and things.', sentence: 'You are not just part of my world, Fatema, you are the best part of it.' },
  { answer: 'WORTH', clue: 'WORST', definition: 'The value or importance that something or someone deserves.', sentence: 'Fatema is worth every quiet sacrifice and every loud celebration.' },
  { answer: 'APPLE', clue: 'LADLE', definition: 'A round, crisp fruit that grows on a tree.', sentence: 'Sharing an apple with you still feels like a perfect little date.' },
  { answer: 'BEACH', clue: 'HEADY', definition: 'A sandy or pebbly shore beside the sea or a lake.', sentence: 'Give me a quiet beach, your hand in mine, and nowhere else to be.' },
  { answer: 'BREAD', clue: 'BLAND', definition: 'A staple food made by baking a dough of flour and water.', sentence: 'Warm bread and your laughter across the table is my favorite kind of morning.' },
  { answer: 'CHARM', clue: 'SCARY', definition: 'A quality that delights, attracts, or fascinates others.', sentence: 'Fatema has a charm that only grows lovelier the longer you know her.' },
  { answer: 'CREAM', clue: 'CRIMP', definition: 'The thick, fatty part of milk, or something smooth and rich.', sentence: 'Even plain coffee tastes better with cream and your company, Fatema.' },
];
