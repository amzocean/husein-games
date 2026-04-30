const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Force revalidation for HTML files so new deploys are picked up immediately
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path.endsWith('/')) {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});

// Serve static files (landing page, tiles, valentines, ludo)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// LUDO GAME SERVER (Socket.IO namespace: /ludo)
// ============================================================
const ludoNs = io.of('/ludo');

const COLORS = ['red', 'green', 'yellow', 'blue'];
const IDLE_TIMEOUT = 30 * 60 * 1000;
const TURN_SKIP_DELAY = 1500;
const DISCONNECT_GRACE = 15 * 60 * 1000; // 15 minutes — mobile tabs suspend sockets
const LOBBY_DISCONNECT_GRACE = 5 * 60 * 1000; // 5 minutes — lobby grace for iOS tab switching
const AUTO_PLAY_DELAY = 60 * 1000; // 1 minute — auto-play if player is idle

// --- Cheat mode: set to [] to disable ---
const CHEAT_NAMES = ['fatema'];

// --- Commentary pools (shuffled per game start for variety) ---
const COMMENTARY_MASTER = {
  capture: [
    "Nikaal diya! 💥", "Dhoom machale! 💃", "Out kar diya bhai!",
    "Vaat laga di! 😤", "Kya shot maara! 🏏", "Supari complete! 🎯",
    "Gaya tel lene! 🛢️", "Wapas chal beta! 👋", "Kaanta laga! 💀",
    "Babaji ka thullu! 🤣", "Thappad se darr nahi lagta! 👏",
    "Panauti hat gayi! ✨", "Clean bowled! 🏏", "Udta Punjab! ✈️",
    "Popcorn moment! 🍿", "Bhabhi ji ghar pe! 🏠",
    "Hero ki entry! 🤠", "Style mein bheja ghar! 😏",
    "Byebye see you never! 😂", "Phirse line mein lago! 🎢",
    "Ye toh trailer tha! 🎬", "Full power shot! 💪",
    "Run out! 🏏", "Wicket gir gayi! 🎉", "Aur ek bites the dust! 💨",
    "Oopsie daisy! 🌼", "KO punch! 🥊", "Khatam, tata, bye bye! 👋",
    "Phir milenge! 🏘️", "Bazinga! 💥", "Ye hui na baat! 🔥"
  ],
  six: [
    "SIXER! 🏏", "Luck ka badshah!", "Kya baat hai! 🔥",
    "Sixer! Dhoni style! 🏏", "Chha gaye guru! 🙌",
    "Ye banda aag hai! 🔥", "Seeti bajao! 🎶",
    "Picture abhi baaki hai! 🎬", "Kya gazab dice maara! 🎲",
    "Maximum! 🏏🎆", "Rohit Sharma mode! 🏏",
    "Paisa wasool! 💰", "Stadium mein silence! 🤫",
    "Yuvraj ki yaad aa gayi! 🏏", "Helicopter shot! 🚁",
    "Chhakka maar ke gaya! 🎯", "Dice ne bola I love you! 😍",
    "Sixer pe sixer! 🎇", "Ye dekho talent! 🌟",
    "Form mein hai boss! 💪", "Gaadi first gear mein! 🚗",
    "All engines firing! 🚀", "Isko rokna namumkin! 🛑❌",
    "Chakka! Commentary box mein! 📺", "Dice whisperer! 🎲🤫",
    "Six on demand! 📲", "Rajnikanth style! 😎"
  ],
  doubleSix: [
    "Double six?! Ye toh Don hai! 😎", "Back to back! Unstoppable! 🚂",
    "Koi rokk nahi sakta! 🔥", "Lagaan wali innings! 🏏",
    "Ye toh tsunami hai! 🌊", "Shahenshah on fire! 👑🔥",
    "Dice ne pyaar kar liya! 💕🎲", "Back to back like Baahubali! 🏔️",
    "Ye player hai ya jadoogar! 🪄", "Bollywood script chal rahi! 📺",
    "Luck OP hai! ⚡", "Dice ne loyalty de di! 🤝",
    "Sirf aapke liye chhakke! 🎁", "Train rukti nahi! 🚂💨",
    "Ye toh magic hai! ✨", "Kisi ki nazar nahi lagegi! 🧿",
    "Double dhamaka! 💥💥", "Biryani mein double masala! 🍗🔥"
  ],
  stuck: [
    "Kismat ke kharaab din... 😩", "Arre yaar! 😫",
    "Kuch nahi mil raha... 🍀", "Bas kar bhai... rula dega kya 😭",
    "Thoda sabar karo... ⏳", "Chai peelo, kuch nahi hoga ☕",
    "Taqdeer hi kharab hai! 🥲", "Dice mein bhi politics?! 🗳️",
    "Koi toh dua karo! 🤲", "Luck left the chat! 💬❌",
    "Signal nahi aa raha! 📵", "Mercury retrograde hai! ♏",
    "Kundli mein mangal hai! 🔴", "Pura traffic jam! 🚗🚗🚗",
    "Waiting room vibes! 🏥", "Buffer... buffer... ⏳",
    "Abhi toh party shuru hui thi! 🎉😭", "Somebody pray for them! 🙏",
    "Aaj ka din kharab hai! 📅", "Nazar lag gayi! 🧿",
    "Lagta hai puja karni padegi! 🛕", "Dice ne unfriend kar diya! 💔",
    "404: Move not found! 🖥️", "System hang ho gaya! 💻"
  ],
  leaveBase: [
    "Entry maarli! 🎬", "Aa raha hai! 🏃", "Chalo ji, shuru! 🎉",
    "Ek tha tiger... nikla! 🐯", "First class entry! 🌟",
    "Tiger zinda hai! 🐅", "Nikla hai kaun?! 👀", "Seedha action mode! 💪",
    "Ladies and gentlemen! 🎤", "Player has entered the game! 🎮",
    "Runway pe aa gaya! ✈️", "Launch successful! 🚀",
    "On your marks! 🏁", "Level 1 start! 🎮",
    "Boarding complete! 🚂", "GPS activated! 📍",
    "Ready player one! 🕹️", "Scene on hai! 🎥",
    "Let's gooo! 🏃💨", "The chase begins! 🏃‍♂️",
    "New challenger approaching! ⚔️", "Naya khiladi! 🎮",
    "Pandora's box khul gaya! 📦"
  ],
  reachHome: [
    "Ghar aa gaya! 🏠", "Apna time aa gaya! ⭐",
    "Safe! Ek aur andar! 🎯", "Home run! 🏡", "Ek aur paar! 🙌",
    "Pension time! 👴", "Ghar ka raasta mil gaya! 🧭",
    "No return ticket needed! 🎫", "Mission accomplished! ✅",
    "Retired hurt nahi, retired happy! 😊", "Ek aur settle ho gaya! 🛋️",
    "Safe landing! ✈️🏁", "Parking ho gayi! 🅿️",
    "One down, more to go! ✊", "Job done! 🎯",
    "VIP lounge mein! 🍾", "Finish line cross! 🏅",
    "Suraj doob gaya... safely! 🌅", "Ghar pohonch gaya bhai! 🏡✨",
    "Final destination reached! 🎬", "Rest in peace... fully! 😴"
  ],
  win: [
    "Jeet gaya bhai! 🏆", "And the Oscar goes to... 🎬",
    "Champion! 👑", "Mogambo khush hua! 😈", "All izz well! 🌟",
    "Bazigar! 🎭", "Aaj mere paas... sab hai! 💰", "Trophy lao bhai! 🏆🏆",
    "GG! Well played! 🤝", "Naam toh suna hoga! 😎",
    "History has been made! 📜", "The king is here! 👑🎉",
    "Ek number! 🥇", "World Cup jeet liya! 🌍🏆",
    "Bharat mata ki jai! 🇮🇳", "Aaj toh diwali hai! 🪔",
    "Standing ovation! 👏👏👏", "Legend! 🐐",
    "Ye cinema hai cinema! 🎬✨", "Waheguru! Kya khel tha! 🙏"
  ],
  one: [
    "Ikke pe ikka! 🎲", "Ek - lonely number! 😢", "Baby steps! 👶",
    "Chinti chal! 🐜", "Ek dum se ek! 😑",
    "Turtle speed activated! 🐢", "One is the loneliest number! 🎵",
    "Micro step! 🔬", "Suno ek baat! ☝️",
    "Ek toh kam hai! 🤏", "Ek hi kaafi hai... nahi hai! 😂",
    "Crawling mode! 🐛", "Loading... 1%! ⏳",
    "Ek chhota sa kadam! 👣", "Plot twist nahi aaya! 📖"
  ],
  two: [
    "Do ka dum! ✌️", "Jodi number one! 💑",
    "Do kadam chal diye! 👣", "Double roti! 🍞",
    "Do ankhein baarah haath! 👀", "Two is company! 🫂",
    "Jodidar mil gaya! 💕", "Doosra! 🏏",
    "Twins vibes! 👯", "Second gear! 🚗",
    "Double trouble! 😈😈", "Ek ke baad ek! 🎯",
    "Do pal ka ye jeevan hai! 🎶", "Chal diye do kadam! 🚶‍♂️"
  ],
  three: [
    "Teen maar khan! 🤠", "Teen tigada kaam bigada! 😬",
    "Hat-trick! 🎩", "Tees maar khan vibes! ⚔️",
    "Third time's a charm! 🍀", "Tirangi chal! 🇮🇳",
    "Three musketeers! ⚔️", "Tri-force! 🔺",
    "Teen patti vibes! 🃏", "Triple engine! 🚂🚂🚂",
    "3 Idiots! 🎓", "Three cheers! 🥂🥂🥂",
    "Tinku jiya! 🎵", "Average hai boss! 📊"
  ],
  four: [
    "Chaar chand laga diye! 🌙", "Almost paanch... 😏",
    "Char kadam chal ke! 💃", "Chaar bottle vodka! 🍾",
    "Boundary! 🏏", "Four more! 🔢",
    "4G speed! 📶", "Char log kya kahenge! 🤷",
    "Square deal! ⬛", "Char dhaam yatra! 🛕",
    "Fantastic four! 🦸", "Not bad not bad! 👌",
    "Solid four! 🏏", "Char guna zyada! 4️⃣"
  ],
  five: [
    "Ek aur hota toh sixer! 😩", "Paanch ka punch! 👊",
    "So close yet so far! 😤", "Panch Pandav chal pade! ⚔️",
    "Paanchvi pass! 📚", "High five! 🖐️",
    "Fingers crossed tha... almost! 🤞", "5 star! ⭐⭐⭐⭐⭐",
    "Paanch rupaiya baarah aana! 💰", "Half dozen minus one! 😅",
    "Five alive! ✋", "Pentagon move! ⬠",
    "5G speed! 📡", "Punch mara! 🥊",
    "Ek number se reh gaya! 😤", "Almost glory! 🏆❌"
  ]
};
// Live commentary pool — shuffled copy per game for non-repetitive ordering
let COMMENTARY = {};
function shuffleCommentary() {
  COMMENTARY = {};
  for (const key of Object.keys(COMMENTARY_MASTER)) {
    const arr = [...COMMENTARY_MASTER[key]];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    COMMENTARY[key] = arr;
  }
}
shuffleCommentary(); // initial shuffle
const COMMENTARY_COOLDOWN = 2; // minimum turns between comments

function log(msg, data) {
  const ts = new Date().toISOString().slice(11, 23);
  if (data !== undefined) {
    console.log(`[LUDO ${ts}] ${msg}`, JSON.stringify(data));
  } else {
    console.log(`[LUDO ${ts}] ${msg}`);
  }
}

let game = null;

function newGame(creatorSession, creatorName) {
  return {
    phase: 'lobby',
    players: [{
      sessionId: creatorSession,
      name: creatorName,
      color: COLORS[0],
      connected: true,
      socketId: null,
      disconnectTimer: null
    }],
    currentPlayerIndex: 0,
    diceValue: null,
    diceRolled: false,
    tokens: {},
    winner: null,
    lastCapture: null,
    commentary: null,
    commentaryTurn: -99,
    consecutiveSixes: 0,
    noSixWhileAllBase: {},  // per-color counter: consecutive non-6 rolls while all 4 tokens in base
    awaitingCheatPick: false,
    turnNumber: 0,
    idleTimer: null,
    turnTimer: null,
    autoPlayTimer: null
  };
}

function resetGame() {
  if (game && game.idleTimer) clearTimeout(game.idleTimer);
  if (game && game.turnTimer) clearTimeout(game.turnTimer);
  if (game && game.autoPlayTimer) clearTimeout(game.autoPlayTimer);
  game = null;
  log('Game reset to idle');
  broadcastState();
}

const PATH = [];
(function buildPath() {
  for (let i = 6; i >= 0; i--) PATH.push([13, i]);
  PATH.push([12, 0]);
  for (let i = 0; i <= 6; i++) PATH.push([11, i]);
  for (let i = 10; i >= 8; i--) PATH.push([i, 6]);
  for (let i = 0; i <= 6; i++) PATH.push([7, i]);
  PATH.push([6, 0]);
  PATH.push([5, 0]);
  for (let i = 0; i <= 6; i++) PATH.push([4, i]);
  PATH.push([3, 6]);
  PATH.push([2, 6]);
  for (let i = 6; i >= 0; i--) PATH.push([1, i]);
  PATH.push([0, 7]);
  for (let i = 0; i <= 5; i++) PATH.push([i, 8]);
  for (let i = 8; i >= 6; i--) PATH.push([4, i]);
  for (let i = 8; i <= 14; i++) PATH.push([5, i]);
  PATH.push([6, 14]);
  for (let i = 14; i >= 8; i--) PATH.push([7, i]);
  PATH.push([8, 14]);
  for (let i = 14; i >= 8; i--) PATH.push([9, i]);
  for (let i = 8; i <= 10; i++) PATH.push([i, 8]);
  for (let i = 14; i >= 8; i--) PATH.push([11, i]);
  PATH.push([12, 8]);
  PATH.push([13, 8]);
  for (let i = 8; i <= 14; i++) PATH.push([14, i]);
})();

const START_OFFSETS = { red: 0, green: 13, yellow: 26, blue: 39 };
const HOME_STRETCHES = {
  red: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  green: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  yellow: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  blue: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]]
};
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

function rollDice(color) {
  const allInBase = game.tokens[color] && game.tokens[color].every(s => s === 0);
  if (allInBase && (game.noSixWhileAllBase[color] || 0) >= 5) {
    // Mercy rule: force a 6 after 5 consecutive non-6 rolls with all tokens stuck in base
    log(`MERCY 6 for ${color} (${game.noSixWhileAllBase[color]} non-6 rolls while all in base)`);
    return 6;
  }
  // Anti-streak rule: after 2 consecutive sixes, third roll is capped at 1-3
  if (game.consecutiveSixes >= 2) {
    const capped = crypto.randomInt(1, 4); // 1, 2, or 3
    log(`CAPPED ROLL for ${color} (after ${game.consecutiveSixes} consecutive sixes): ${capped}`);
    return capped;
  }
  return crypto.randomInt(1, 7);
}

function getAbsolutePathIndex(color, step) {
  if (step <= 0 || step > 51) return -1;
  return (START_OFFSETS[color] + step - 1) % 52;
}

function canMoveToken(color, tokenIdx, diceValue) {
  const step = game.tokens[color][tokenIdx];
  if (step === 0) return diceValue === 6;
  if (step === 57) return false;
  const newStep = step + diceValue;
  if (newStep > 57) return false;
  return true;
}

function moveToken(playerColor, tokenIdx, diceValue) {
  const step = game.tokens[playerColor][tokenIdx];
  let captured = false;

  if (step === 0 && diceValue === 6) {
    game.tokens[playerColor][tokenIdx] = 1;
    // Reset mercy counter immediately when a token comes out of base
    game.noSixWhileAllBase[playerColor] = 0;
    log(`${playerColor} token ${tokenIdx} leaves base → step 1`);
    const absIdx = getAbsolutePathIndex(playerColor, 1);
    captured = checkCapture(playerColor, absIdx);
  } else if (step > 0 && step < 57) {
    const newStep = step + diceValue;
    if (newStep <= 57) {
      game.tokens[playerColor][tokenIdx] = newStep;
      log(`${playerColor} token ${tokenIdx} step ${step} → ${newStep}`);
      if (newStep <= 51) {
        const absIdx = getAbsolutePathIndex(playerColor, newStep);
        captured = checkCapture(playerColor, absIdx);
      }
    }
  }
  return captured;
}

function checkCapture(attackerColor, absPathIdx) {
  if (SAFE_SQUARES.includes(absPathIdx)) return false;
  let captured = false;
  for (const color of COLORS) {
    if (color === attackerColor) continue;
    if (!game.tokens[color]) continue;
    for (let i = 0; i < 4; i++) {
      const s = game.tokens[color][i];
      if (s >= 1 && s <= 51) {
        const theirAbsIdx = getAbsolutePathIndex(color, s);
        if (theirAbsIdx === absPathIdx) {
          game.tokens[color][i] = 0;
          captured = true;
          game.lastCapture = { by: attackerColor, victim: color, tokenIdx: i, pathIdx: absPathIdx };
          log(`CAPTURE: ${attackerColor} sent ${color} token ${i} back to base at pathIdx ${absPathIdx}`);
        }
      }
    }
  }
  return captured;
}

function checkWin(color) {
  return game.tokens[color] && game.tokens[color].every(s => s === 57);
}

function setCommentary(type) {
  if (game.turnNumber - game.commentaryTurn < COMMENTARY_COOLDOWN) return;
  const pool = COMMENTARY[type];
  if (!pool || pool.length === 0) return;
  game.commentary = pool[crypto.randomInt(0, pool.length)];
  game.commentaryTurn = game.turnNumber;
}

// Capture and win comments always show (bypass cooldown)
function setCommentaryForce(type) {
  const pool = COMMENTARY[type];
  if (!pool || pool.length === 0) return;
  game.commentary = pool[crypto.randomInt(0, pool.length)];
  game.commentaryTurn = game.turnNumber;
}

function addMoveCommentary(color, tokenIdx, captured, oldStep) {
  // Priority: capture > reachHome > leaveBase (win handled separately)
  if (captured) {
    setCommentaryForce('capture');
  } else if (game.tokens[color][tokenIdx] === 57) {
    setCommentary('reachHome');
  } else if (oldStep === 0) {
    setCommentary('leaveBase');
  }
}

function nextTurn(extraTurn) {
  if (game.turnTimer) { clearTimeout(game.turnTimer); game.turnTimer = null; }
  if (game.autoPlayTimer) { clearTimeout(game.autoPlayTimer); game.autoPlayTimer = null; }
  resetIdleTimer();
  game.diceValue = null;
  game.diceRolled = false;

  if (!extraTurn) {
    let attempts = 0;
    do {
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
      attempts++;
    } while (!game.players[game.currentPlayerIndex].connected && attempts < game.players.length);
    if (attempts >= game.players.length) {
      log('No connected players, ending game');
      game.phase = 'finished';
      game.winner = 'disconnect';
      broadcastState();
      setTimeout(resetGame, 30000);
      return;
    }
  }
  log(`Turn: ${game.players[game.currentPlayerIndex].name}(${game.players[game.currentPlayerIndex].color})`);
  game.turnDeadline = Date.now() + AUTO_PLAY_DELAY;
  game.turnNumber++;
  broadcastState();
  game.lastCapture = null; // Clear after broadcasting so banner shows only once
  game.commentary = null;  // Clear after broadcasting so toast shows only once
  startAutoPlayTimer();
}

function startAutoPlayTimer() {
  if (!game || game.phase !== 'playing') return;
  if (game.autoPlayTimer) clearTimeout(game.autoPlayTimer);
  game.turnDeadline = Date.now() + AUTO_PLAY_DELAY;
  game.autoPlayTimer = setTimeout(() => {
    if (!game || game.phase !== 'playing') return;
    const player = game.players[game.currentPlayerIndex];
    if (!player) return;

    if (!game.diceRolled) {
      // Auto-roll + auto-move in one shot
      const value = rollDice(player.color);
      game.diceValue = value;
      game.diceRolled = true;
      log(`AUTO-PLAY: rolled ${value} for ${player.name}(${player.color})`);

      // Track no-6-while-all-in-base counter (same as processDiceRoll)
      const allInBase = game.tokens[player.color] && game.tokens[player.color].every(s => s === 0);
      if (allInBase) {
        if (value === 6) {
          game.noSixWhileAllBase[player.color] = 0;
        } else {
          game.noSixWhileAllBase[player.color] = (game.noSixWhileAllBase[player.color] || 0) + 1;
        }
      }

      const movable = [];
      for (let i = 0; i < 4; i++) {
        if (canMoveToken(player.color, i, value)) movable.push(i);
      }

      if (movable.length === 0) {
        broadcastState();
        game.turnTimer = setTimeout(() => {
          if (game && game.phase === 'playing') nextTurn(false);
        }, TURN_SKIP_DELAY);
      } else {
        const pick = movable.length === 1 ? movable[0] : movable[crypto.randomInt(0, movable.length)];
        log(`AUTO-PLAY: moved token ${pick} for ${player.name}(${player.color})`);
        const oldStep = game.tokens[player.color][pick];
        const captured = moveToken(player.color, pick, value);
        if (checkWin(player.color)) {
          setCommentaryForce('win');
          game.phase = 'finished';
          game.winner = player.color;
          log(`GAME OVER: ${player.name}(${player.color}) wins!`);
          broadcastState();
          setTimeout(resetGame, 30000);
        } else {
          addMoveCommentary(player.color, pick, captured, oldStep);
          broadcastState();
          game.commentary = null;
          game.turnTimer = setTimeout(() => {
            if (game && game.phase === 'playing') {
              const reachedHome = game.tokens[player.color][pick] === 57;
              nextTurn(value === 6 || captured || reachedHome);
            }
          }, 1000);
        }
      }
    } else {
      // Dice already rolled but no token picked — auto-pick random
      const movable = [];
      for (let i = 0; i < 4; i++) {
        if (canMoveToken(player.color, i, game.diceValue)) movable.push(i);
      }
      if (movable.length > 0) {
        const pick = movable[crypto.randomInt(0, movable.length)];
        log(`AUTO-PLAY: moved token ${pick} for ${player.name}(${player.color})`);
        const oldStep = game.tokens[player.color][pick];
        const captured = moveToken(player.color, pick, game.diceValue);
        if (checkWin(player.color)) {
          setCommentaryForce('win');
          game.phase = 'finished';
          game.winner = player.color;
          log(`GAME OVER: ${player.name}(${player.color}) wins!`);
          broadcastState();
          setTimeout(resetGame, 30000);
        } else {
          addMoveCommentary(player.color, pick, captured, oldStep);
          const reachedHome = game.tokens[player.color][pick] === 57;
          nextTurn(game.diceValue === 6 || captured || reachedHome);
        }
      } else {
        nextTurn(false);
      }
    }
  }, AUTO_PLAY_DELAY);
}

function resetIdleTimer() {
  if (game.idleTimer) clearTimeout(game.idleTimer);
  game.idleTimer = setTimeout(() => {
    log('IDLE TIMEOUT: game ended due to inactivity');
    game.phase = 'finished';
    game.winner = 'idle';
    broadcastState();
    setTimeout(resetGame, 10000);
  }, IDLE_TIMEOUT);
}

function getClientState() {
  if (!game) return { phase: 'idle' };
  return {
    phase: game.phase,
    players: game.players.map(p => ({
      name: p.name,
      color: p.color,
      connected: p.connected,
      sessionId: p.sessionId
    })),
    currentPlayerIndex: game.currentPlayerIndex,
    diceValue: game.diceValue,
    diceRolled: game.diceRolled,
    tokens: game.tokens,
    winner: game.winner,
    lastCapture: game.lastCapture || null,
    commentary: game.commentary || null,
    turnTimeLeft: game.turnDeadline ? Math.max(0, game.turnDeadline - Date.now()) : null,
    turnDuration: AUTO_PLAY_DELAY
  };
}

function broadcastState() {
  ludoNs.emit('state', getClientState());
}

// --- Socket.IO /ludo namespace ---
ludoNs.on('connection', (socket) => {
  log(`CONNECT socket=${socket.id}`);
  socket.emit('state', getClientState());

  socket.on('rejoin', (sessionId) => {
    log(`REJOIN socket=${socket.id} session=${sessionId}`);
    if (!game) { log('  no game to rejoin'); return; }
    const player = game.players.find(p => p.sessionId === sessionId);
    if (player) {
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
        log(`  cleared disconnect grace timer for ${player.name}`);
      }
      player.socketId = socket.id;
      player.connected = true;
      log(`  rejoined as ${player.name}(${player.color})`);
      broadcastState();
    } else {
      log(`  session not found in game`);
    }
  });

  socket.on('create', ({ name }) => {
    log(`CREATE from socket=${socket.id} name=${name}`);
    if (game) {
      socket.emit('error_msg', 'A game is already in progress. Wait for it to finish.');
      log('  rejected: game already exists');
      return;
    }
    const sessionId = crypto.randomUUID();
    game = newGame(sessionId, name);
    game.players[0].socketId = socket.id;
    socket.emit('session', sessionId);
    log(`  game created, session=${sessionId}`);
    broadcastState();
  });

  socket.on('join', ({ name }) => {
    log(`JOIN from socket=${socket.id} name=${name}`);
    if (!game || game.phase !== 'lobby') {
      socket.emit('error_msg', 'No game in lobby to join.');
      log('  rejected: no lobby');
      return;
    }
    if (game.players.length >= 4) {
      socket.emit('error_msg', 'Game is full (4 players max).');
      log('  rejected: full');
      return;
    }
    const sessionId = crypto.randomUUID();
    const color = COLORS[game.players.length];
    game.players.push({
      sessionId,
      name,
      color,
      connected: true,
      socketId: socket.id,
      disconnectTimer: null
    });
    socket.emit('session', sessionId);
    log(`  joined as ${color}, session=${sessionId}, total=${game.players.length}`);
    broadcastState();
  });

  socket.on('start', (sessionId) => {
    log(`START from session=${sessionId}`);
    if (!game || game.phase !== 'lobby') {
      socket.emit('error_msg', 'No game in lobby to start.');
      return;
    }
    if (game.players[0].sessionId !== sessionId) {
      socket.emit('error_msg', 'Only the game creator can start.');
      return;
    }
    if (game.players.length < 2) {
      socket.emit('error_msg', 'Need at least 2 players to start.');
      return;
    }
    // Remove any disconnected lobby players before starting
    game.players = game.players.filter(p => p.connected);
    game.players.forEach((p, i) => p.color = COLORS[i]);
    if (game.players.length < 2) {
      socket.emit('error_msg', 'Need at least 2 connected players to start.');
      return;
    }
    game.phase = 'playing';
    shuffleCommentary(); // fresh shuffle each game for variety
    for (const p of game.players) {
      game.tokens[p.color] = [0, 0, 0, 0];
    }
    game.currentPlayerIndex = 0;
    resetIdleTimer();
    log(`GAME STARTED with ${game.players.length} players:`,
      game.players.map(p => `${p.name}(${p.color})`));
    game.turnDeadline = Date.now() + AUTO_PLAY_DELAY;
    broadcastState();
    startAutoPlayTimer();
  });

  socket.on('roll', (sessionId) => {
    if (!game || game.phase !== 'playing') return;
    const playerIdx = game.players.findIndex(p => p.sessionId === sessionId);
    if (playerIdx < 0 || playerIdx !== game.currentPlayerIndex) return;
    if (game.diceRolled) return;

    const player = game.players[playerIdx];

    // Cheat mode: let cheat player choose their dice value
    if (CHEAT_NAMES.includes(player.name.toLowerCase()) && !game.awaitingCheatPick) {
      game.awaitingCheatPick = true;
      socket.emit('choose_dice');
      return;
    }

    // Player rolled — don't reset timer, it covers the whole turn (roll + pick)
    processDiceRoll(player, rollDice(player.color));
  });

  socket.on('dice_choice', ({ sessionId, value }) => {
    if (!game || game.phase !== 'playing') return;
    const playerIdx = game.players.findIndex(p => p.sessionId === sessionId);
    if (playerIdx < 0 || playerIdx !== game.currentPlayerIndex) return;
    if (!game.awaitingCheatPick) return;
    if (!Number.isInteger(value) || value < 1 || value > 6) return;

    const player = game.players[playerIdx];
    game.awaitingCheatPick = false;
    log(`CHEAT ROLL: ${player.name}(${player.color}) chose ${value}`);
    processDiceRoll(player, value);
  });
  function processDiceRoll(player, value) {
    game.diceValue = value;
    game.diceRolled = true;
    log(`ROLL: ${player.name}(${player.color}) rolled ${value}`);

    // Track no-6-while-all-in-base counter
    const allInBase = game.tokens[player.color] && game.tokens[player.color].every(s => s === 0);
    if (allInBase) {
      if (value === 6) {
        game.noSixWhileAllBase[player.color] = 0;
      } else {
        game.noSixWhileAllBase[player.color] = (game.noSixWhileAllBase[player.color] || 0) + 1;
      }
    }

    // Commentary: dice events
    if (value === 6) {
      game.consecutiveSixes++;
      if (game.consecutiveSixes >= 2) {
        setCommentaryForce('doubleSix');
      } else {
        setCommentary('six');
      }
    } else {
      game.consecutiveSixes = 0;
      const diceNames = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five' };
      if (diceNames[value]) setCommentary(diceNames[value]);
    }

    const movable = [];
    for (let i = 0; i < 4; i++) {
      if (canMoveToken(player.color, i, value)) movable.push(i);
    }
    log(`  movable tokens: ${JSON.stringify(movable)}`);

    if (movable.length === 0) {
      setCommentary('stuck');
      broadcastState();
      game.commentary = null;
      game.turnTimer = setTimeout(() => {
        if (game && game.phase === 'playing') {
          nextTurn(false);
        }
      }, TURN_SKIP_DELAY);
    } else if (movable.length === 1) {
      // Show dice value first, then auto-move after a short delay
      broadcastState();
      game.turnTimer = setTimeout(() => {
        if (!game || game.phase !== 'playing') return;
        const oldStep = game.tokens[player.color][movable[0]];
        const captured = moveToken(player.color, movable[0], value);
        if (checkWin(player.color)) {
          setCommentaryForce('win');
          game.phase = 'finished';
          game.winner = player.color;
          log(`GAME OVER: ${player.name}(${player.color}) wins!`);
          broadcastState();
          setTimeout(resetGame, 30000);
        } else {
          addMoveCommentary(player.color, movable[0], captured, oldStep);
          const reachedHome = game.tokens[player.color][movable[0]] === 57;
          const extra = value === 6 || captured || reachedHome;
          log(`  auto-move token ${movable[0]}, extra turn: ${extra}`);
          nextTurn(extra);
        }
      }, 1000);
    } else {
      // Multiple tokens movable — original auto-play timer still ticking
      broadcastState();
    }
  }

  socket.on('move', ({ sessionId, tokenIndex: tokenIdx }) => {
    if (!game || game.phase !== 'playing') return;
    const playerIdx = game.players.findIndex(p => p.sessionId === sessionId);
    if (playerIdx < 0 || playerIdx !== game.currentPlayerIndex) return;
    if (!game.diceRolled || game.diceValue === null) return;

    // Player acted — clear auto-play timer
    if (game.autoPlayTimer) { clearTimeout(game.autoPlayTimer); game.autoPlayTimer = null; }

    const player = game.players[playerIdx];
    if (!canMoveToken(player.color, tokenIdx, game.diceValue)) {
      socket.emit('error_msg', 'Invalid move.');
      return;
    }

    log(`MOVE: ${player.name}(${player.color}) token ${tokenIdx} with dice ${game.diceValue}`);
    const oldStep = game.tokens[player.color][tokenIdx];
    const captured = moveToken(player.color, tokenIdx, game.diceValue);

    if (checkWin(player.color)) {
      setCommentaryForce('win');
      game.phase = 'finished';
      game.winner = player.color;
      log(`GAME OVER: ${player.name}(${player.color}) wins!`);
      broadcastState();
      setTimeout(resetGame, 30000);
    } else {
      addMoveCommentary(player.color, tokenIdx, captured, oldStep);
      const reachedHome = game.tokens[player.color][tokenIdx] === 57;
      const extra = game.diceValue === 6 || captured || reachedHome;
      log(`  extra turn: ${extra}`);
      nextTurn(extra);
    }
  });

  socket.on('reset', () => {
    log(`RESET requested`);
    resetGame();
  });

  // Exit game: player removes themselves
  socket.on('exit_game', (sessionId) => {
    if (!game || game.phase !== 'playing') return;
    const playerIdx = game.players.findIndex(p => p.sessionId === sessionId);
    if (playerIdx < 0) return;
    const player = game.players[playerIdx];
    log(`EXIT_GAME: ${player.name}(${player.color}) left the game`);

    // Remove their tokens
    delete game.tokens[player.color];
    game.players.splice(playerIdx, 1);

    // If only 1 player left, they win
    if (game.players.length <= 1) {
      if (game.players.length === 1) {
        game.winner = game.players[0].color;
        log(`  ${game.players[0].name} wins by default (all others left)`);
      }
      game.phase = 'finished';
      clearTimeout(game.idleTimer);
      clearTimeout(game.turnTimer);
      clearTimeout(game.autoPlayTimer);
      broadcastState();
      return;
    }

    // Fix currentPlayerIndex
    if (game.currentPlayerIndex >= game.players.length) {
      game.currentPlayerIndex = 0;
    } else if (playerIdx < game.currentPlayerIndex) {
      game.currentPlayerIndex--;
    } else if (playerIdx === game.currentPlayerIndex) {
      // It was the exiting player's turn — move to next
      if (game.currentPlayerIndex >= game.players.length) game.currentPlayerIndex = 0;
      game.diceRolled = false;
      game.diceValue = null;
      clearTimeout(game.autoPlayTimer);
      startAutoPlayTimer();
    }
    broadcastState();
  });

  // End game: only creator can force-end
  socket.on('end_game', (sessionId) => {
    if (!game) return;
    if (game.players[0]?.sessionId !== sessionId) {
      socket.emit('error_msg', 'Only the game creator can end the game.');
      return;
    }
    log(`END_GAME: creator ${game.players[0].name} ended the game`);
    resetGame();
  });

  socket.on('reset_lobby', (sessionId) => {
    if (!game || game.phase !== 'lobby') return;
    if (game.players[0]?.sessionId !== sessionId) {
      socket.emit('error_msg', 'Only the game creator can reset the lobby.');
      return;
    }
    log(`RESET_LOBBY: creator ${game.players[0].name} reset the lobby`);
    resetGame();
  });

  socket.on('debug_roll', ({ sessionId, value }) => {
    if (!game || game.phase !== 'playing') return;
    const playerIdx = game.players.findIndex(p => p.sessionId === sessionId);
    if (playerIdx < 0 || playerIdx !== game.currentPlayerIndex) return;
    if (game.diceRolled) return;

    const player = game.players[playerIdx];
    game.diceValue = value;
    game.diceRolled = true;
    log(`DEBUG ROLL: ${player.name}(${player.color}) forced ${value}`);

    const movable = [];
    for (let i = 0; i < 4; i++) {
      if (canMoveToken(player.color, i, value)) movable.push(i);
    }

    if (movable.length === 0) {
      broadcastState();
      game.turnTimer = setTimeout(() => {
        if (game && game.phase === 'playing') nextTurn(false);
      }, TURN_SKIP_DELAY);
    } else if (movable.length === 1) {
      const captured = moveToken(player.color, movable[0], value);
      if (checkWin(player.color)) {
        game.phase = 'finished';
        game.winner = player.color;
        broadcastState();
        setTimeout(resetGame, 30000);
      } else {
        const reachedHome = game.tokens[player.color][movable[0]] === 57;
        nextTurn(value === 6 || captured || reachedHome);
      }
    } else {
      broadcastState();
    }
  });

  socket.on('reaction', ({ sessionId, emoji }) => {
    ludoNs.emit('reaction', { sessionId, emoji });
  });

  socket.on('chat', ({ sessionId, message }) => {
    if (!game) return;
    const player = game.players.find(p => p.sessionId === sessionId);
    if (!player) return;
    const text = (message || '').trim().slice(0, 200);
    if (!text) return;
    ludoNs.emit('chat', { name: player.name, color: player.color, text });
  });

  socket.on('disconnect', () => {
    log(`DISCONNECT socket=${socket.id}`);
    if (!game) return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player) { log('  not a player'); return; }
    log(`  player: ${player.name}(${player.color}) phase=${game.phase}`);

    if (game.phase === 'lobby') {
      // Grace period for lobby — iOS suspends sockets when switching apps/tabs
      player.connected = false;
      player.disconnectTimer = setTimeout(() => {
        if (!game || game.phase !== 'lobby') return;
        const idx = game.players.findIndex(p => p.sessionId === player.sessionId);
        if (idx < 0 || player.connected) return; // already rejoined
        game.players.splice(idx, 1);
        game.players.forEach((p, i) => p.color = COLORS[i]);
        log(`LOBBY GRACE EXPIRED: removed ${player.name}, ${game.players.length} remain`);
        if (game.players.length === 0) {
          log(`  lobby empty, resetting game`);
          resetGame();
        }
        broadcastState();
      }, LOBBY_DISCONNECT_GRACE);
      log(`  lobby disconnect — ${LOBBY_DISCONNECT_GRACE/1000}s grace period`);
      broadcastState();
    } else if (game.phase === 'playing') {
      log(`  starting ${DISCONNECT_GRACE/1000}s grace period for reconnection`);
      player.disconnectTimer = setTimeout(() => {
        if (!game || game.phase !== 'playing') return;
        player.connected = false;
        player.disconnectTimer = null;
        log(`GRACE EXPIRED: ${player.name}(${player.color}) did not reconnect`);

        const connectedCount = game.players.filter(p => p.connected).length;
        log(`  connected players: ${connectedCount}`);

        if (connectedCount <= 1) {
          const lastPlayer = game.players.find(p => p.connected);
          game.phase = 'finished';
          game.winner = lastPlayer ? lastPlayer.color : 'disconnect';
          log(`GAME OVER: last player standing → ${game.winner}`);
          broadcastState();
          setTimeout(resetGame, 30000);
        } else if (game.players[game.currentPlayerIndex].sessionId === player.sessionId) {
          log(`  was current player's turn, advancing`);
          nextTurn(false);
        } else {
          broadcastState();
        }
      }, DISCONNECT_GRACE);
    }
  });
});

// ============================================================
// PROPERTY DUEL CARD GAME (Socket.IO namespace: /cards)
// ============================================================
const cardsNs = io.of('/cards');
const CARD_COLORS = ['blue', 'red', 'green', 'yellow', 'black'];
const SET_SIZES = { blue: 2, red: 3, green: 3, yellow: 3, black: 4 };
const RENT_TABLE = {
  blue:   [0, 3, 8],
  red:    [0, 1, 2, 4],
  green:  [0, 1, 3, 5],
  yellow: [0, 1, 2, 4],
  black:  [0, 1, 2, 3, 4],
};
const PROP_COUNTS = { blue: 3, red: 6, green: 6, yellow: 6, black: 8 };
const BANK_VALUES = { rent: 1, steal: 3, swap: 3, wild: 0, block: 4, passgo: 1, debtcollector: 3, birthday: 2, doublerent: 1, dealbreaker: 5 };
const SETS_TO_WIN = 3;
const HAND_LIMIT = 7;
const BLOCK_TIMEOUT = 15000;
const CARD_IDLE_TIMEOUT = 30 * 60 * 1000;

function clog(msg, data) {
  const ts = new Date().toISOString().slice(11, 23);
  if (data !== undefined) console.log(`[CARDS ${ts}] ${msg}`, JSON.stringify(data));
  else console.log(`[CARDS ${ts}] ${msg}`);
}

let cardGame = null;

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck() {
  const d = []; let id = 0;
  for (const c of CARD_COLORS) for (let i = 0; i < PROP_COUNTS[c]; i++) d.push({ id: id++, type: 'property', color: c });
  for (const v of [1,1,1,2,2,2,3,3,5,5,10]) d.push({ id: id++, type: 'money', value: v });
  for (let i = 0; i < 6; i++) d.push({ id: id++, type: 'action', action: 'rent', bankValue: BANK_VALUES.rent });
  for (let i = 0; i < 5; i++) d.push({ id: id++, type: 'action', action: 'steal', bankValue: BANK_VALUES.steal });
  for (let i = 0; i < 4; i++) d.push({ id: id++, type: 'action', action: 'swap', bankValue: BANK_VALUES.swap });
  for (let i = 0; i < 4; i++) d.push({ id: id++, type: 'action', action: 'wild', bankValue: BANK_VALUES.wild });
  for (let i = 0; i < 4; i++) d.push({ id: id++, type: 'action', action: 'block', bankValue: BANK_VALUES.block });
  for (let i = 0; i < 4; i++) d.push({ id: id++, type: 'action', action: 'passgo', bankValue: BANK_VALUES.passgo });
  for (let i = 0; i < 3; i++) d.push({ id: id++, type: 'action', action: 'debtcollector', bankValue: BANK_VALUES.debtcollector });
  for (let i = 0; i < 3; i++) d.push({ id: id++, type: 'action', action: 'birthday', bankValue: BANK_VALUES.birthday });
  for (let i = 0; i < 2; i++) d.push({ id: id++, type: 'action', action: 'doublerent', bankValue: BANK_VALUES.doublerent });
  for (let i = 0; i < 2; i++) d.push({ id: id++, type: 'action', action: 'dealbreaker', bankValue: BANK_VALUES.dealbreaker });
  return shuffleArr(d);
}

function drawCards(n) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (cardGame.deck.length === 0) {
      if (cardGame.discard.length === 0) break;
      cardGame.deck = shuffleArr(cardGame.discard);
      cardGame.discard = [];
      clog('Reshuffled discard into deck');
    }
    drawn.push(cardGame.deck.pop());
  }
  return drawn;
}

function setComplete(cards, color) { return cards.length >= (SET_SIZES[color] || 3); }
function completeSets(p) { return CARD_COLORS.reduce((n, c) => n + (setComplete(p.properties[c], c) ? 1 : 0), 0); }
function oppIdx(i) { return i === 0 ? 1 : 0; }

function newCardPlayer(sessionId, name) {
  return {
    sessionId, name, socketId: null, connected: true,
    hand: [], properties: { blue: [], red: [], green: [], yellow: [], black: [] }, bank: [],
    disconnectTimer: null,
  };
}

function newCG(sessionId, name) {
  return {
    phase: 'lobby',
    players: [newCardPlayer(sessionId, name)],
    deck: [], discard: [],
    currentPlayerIndex: 0,
    actionsLeft: 0,
    pendingAction: null,
    turnPhase: 'waiting',
    winner: null,
    idleTimer: null,
    blockTimer: null,
    lastEvent: null,
  };
}

function resetCG() {
  if (cardGame?.idleTimer) clearTimeout(cardGame.idleTimer);
  if (cardGame?.blockTimer) clearTimeout(cardGame.blockTimer);
  cardGame = null;
  clog('Game reset');
  cardsNs.emit('state', { phase: 'idle' });
}

function resetCGIdle() {
  if (!cardGame) return;
  if (cardGame.idleTimer) clearTimeout(cardGame.idleTimer);
  cardGame.idleTimer = setTimeout(() => {
    clog('IDLE TIMEOUT');
    cardGame.phase = 'finished';
    cardGame.winner = 'idle';
    broadcastCG();
    setTimeout(resetCG, 10000);
  }, CARD_IDLE_TIMEOUT);
}

function getCardState(forIdx) {
  if (!cardGame) return { phase: 'idle' };
  return {
    phase: cardGame.phase,
    players: cardGame.players.map((p, i) => ({
      name: p.name, sessionId: p.sessionId, connected: p.connected,
      properties: p.properties, bank: p.bank,
      handCount: p.hand.length,
      hand: i === forIdx ? p.hand : undefined,
    })),
    currentPlayerIndex: cardGame.currentPlayerIndex,
    actionsLeft: cardGame.actionsLeft,
    turnPhase: cardGame.turnPhase,
    pendingAction: cardGame.pendingAction,
    deckCount: cardGame.deck.length,
    winner: cardGame.winner,
    lastEvent: cardGame.lastEvent,
    setSizes: SET_SIZES,
    rentTable: RENT_TABLE,
    doubleRentActive: cardGame.doubleRentActive || false,
  };
}

function broadcastCG() {
  if (!cardGame) { cardsNs.emit('state', { phase: 'idle' }); return; }
  for (let i = 0; i < cardGame.players.length; i++) {
    const p = cardGame.players[i];
    if (p.socketId) cardsNs.to(p.socketId).emit('state', getCardState(i));
  }
  // spectators
  for (const [sid, sock] of cardsNs.sockets) {
    if (!cardGame.players.some(p => p.socketId === sid)) {
      sock.emit('state', getCardState(-1));
    }
  }
}

function startCardTurn() {
  const p = cardGame.players[cardGame.currentPlayerIndex];
  const drawN = p.hand.length === 0 ? 5 : 2;
  p.hand.push(...drawCards(drawN));
  cardGame.actionsLeft = 3;
  cardGame.turnPhase = 'playing';
  cardGame.pendingAction = null;
  cardGame.doubleRentActive = false;
  cardGame.lastEvent = { type: 'turn_start', player: p.name };
  clog(`Turn: ${p.name}, drew ${drawN}, hand=${p.hand.length}`);
  resetCGIdle();
  broadcastCG();
}

function nextCardTurn() {
  if (cardGame.blockTimer) { clearTimeout(cardGame.blockTimer); cardGame.blockTimer = null; }
  cardGame.currentPlayerIndex = oppIdx(cardGame.currentPlayerIndex);
  startCardTurn();
}

function checkCardWin() {
  for (let i = 0; i < cardGame.players.length; i++) {
    if (completeSets(cardGame.players[i]) >= SETS_TO_WIN) {
      cardGame.phase = 'finished';
      cardGame.winner = cardGame.players[i].name;
      cardGame.lastEvent = { type: 'win', player: cardGame.players[i].name };
      clog(`WINNER: ${cardGame.players[i].name}`);
      broadcastCG();
      setTimeout(resetCG, 60000);
      return true;
    }
  }
  return false;
}

function endCardTurn() {
  const p = cardGame.players[cardGame.currentPlayerIndex];
  if (p.hand.length > HAND_LIMIT) {
    cardGame.turnPhase = 'discarding';
    broadcastCG();
    return;
  }
  nextCardTurn();
}

function useCardAction() {
  cardGame.actionsLeft--;
  if (checkCardWin()) return true;
  if (cardGame.actionsLeft <= 0) { endCardTurn(); return true; }
  return false;
}

function payRentManual(target, actor, moneyIds, propertyIds) {
  // Transfer selected money cards
  for (const mid of moneyIds) {
    const idx = target.bank.findIndex(c => c.id === mid);
    if (idx >= 0) actor.bank.push(target.bank.splice(idx, 1)[0]);
  }
  // Transfer selected property cards
  for (const pid of propertyIds) {
    for (const c of CARD_COLORS) {
      const idx = target.properties[c].findIndex(x => x.id === pid);
      if (idx >= 0) {
        const card = target.properties[c].splice(idx, 1)[0];
        const dest = card.assignedColor || card.color || c;
        actor.properties[dest].push(card);
        break;
      }
    }
  }
}

function totalAssets(player) {
  let total = player.bank.reduce((s, c) => s + c.value, 0);
  for (const c of CARD_COLORS) {
    total += player.properties[c].length; // all properties count, even complete sets
  }
  return total;
}

function getRentAmount(color, count) {
  return (RENT_TABLE[color] && RENT_TABLE[color][count]) || count;
}

function startRentPay(actingPlayer, targetPlayer, color, amount) {
  cardGame.pendingAction = {
    type: 'rent_pay', actingPlayer, targetPlayer, color, amount,
    selectedMoney: [], selectedProperties: []
  };
  cardGame.lastEvent = { type: 'rent_charge', player: cardGame.players[actingPlayer].name, target: cardGame.players[targetPlayer].name, color, amount };
  broadcastCG();
}

function executeSwap(actIdx, myCardId, theirCardId) {
  const me = cardGame.players[actIdx];
  const opp = cardGame.players[oppIdx(actIdx)];
  let myCard = null, myColor = null, theirCard = null, theirColor = null;
  for (const c of CARD_COLORS) {
    let mi = me.properties[c].findIndex(x => x.id === myCardId);
    if (mi >= 0) { myCard = me.properties[c].splice(mi, 1)[0]; myColor = c; }
    let ti = opp.properties[c].findIndex(x => x.id === theirCardId);
    if (ti >= 0) { theirCard = opp.properties[c].splice(ti, 1)[0]; theirColor = c; }
  }
  if (myCard && theirCard) {
    const md = myCard.assignedColor || myCard.color || myColor;
    const td = theirCard.assignedColor || theirCard.color || theirColor;
    opp.properties[md].push(myCard);
    me.properties[td].push(theirCard);
    clog(`Swap: ${me.name} ${myColor} <-> ${opp.name} ${theirColor}`);
  }
}

function executeDealBreaker(actIdx, targetIdx, color) {
  const actor = cardGame.players[actIdx];
  const target = cardGame.players[targetIdx];
  const stolen = target.properties[color].splice(0, target.properties[color].length);
  actor.properties[color].push(...stolen);
  cardGame.lastEvent = { type: 'dealbreaker', player: actor.name, target: target.name, color };
  clog(`Deal Breaker: ${actor.name} took ${color} set from ${target.name}`);
}

function resolveCardAction() {
  if (!cardGame?.pendingAction) return;
  const pa = cardGame.pendingAction;
  if (cardGame.blockTimer) { clearTimeout(cardGame.blockTimer); cardGame.blockTimer = null; }
  const actor = cardGame.players[pa.actingPlayer];
  const target = cardGame.players[pa.targetPlayer];

  if (pa.actionType === 'rent') {
    startRentPay(pa.actingPlayer, pa.targetPlayer, pa.color, pa.amount);
    clog(`Rent: ${target.name} must pay $${pa.amount}`);
    return; // don't clear pendingAction yet
  } else if (pa.actionType === 'steal') {
    for (const c of CARD_COLORS) {
      if (setComplete(target.properties[c], c)) continue;
      const idx = target.properties[c].findIndex(x => x.id === pa.targetCardId);
      if (idx >= 0) {
        const stolen = target.properties[c].splice(idx, 1)[0];
        const dest = stolen.assignedColor || stolen.color || c;
        actor.properties[dest].push(stolen);
        cardGame.lastEvent = { type: 'steal', player: actor.name, target: target.name, color: dest };
        clog(`Steal resolved: ${actor.name} took ${dest} from ${target.name}`);
        break;
      }
    }
  } else if (pa.actionType === 'swap') {
    executeSwap(pa.actingPlayer, pa.myCardId, pa.theirCardId);
    cardGame.lastEvent = { type: 'swap', player: actor.name, target: target.name };
  } else if (pa.actionType === 'debtcollector') {
    startRentPay(pa.actingPlayer, pa.targetPlayer, null, pa.amount);
    clog(`Debt Collector: ${target.name} must pay $${pa.amount}`);
    return;
  } else if (pa.actionType === 'birthday') {
    startRentPay(pa.actingPlayer, pa.targetPlayer, null, pa.amount);
    clog(`Birthday: ${target.name} must pay $${pa.amount}`);
    return;
  } else if (pa.actionType === 'dealbreaker') {
    executeDealBreaker(pa.actingPlayer, pa.targetPlayer, pa.color);
  }

  cardGame.pendingAction = null;
  if (!checkCardWin()) {
    if (cardGame.actionsLeft <= 0) endCardTurn();
    else broadcastCG();
  }
}

cardsNs.on('connection', (socket) => {
  clog(`CONNECT ${socket.id}`);
  if (cardGame) {
    const pi = cardGame.players.findIndex(p => p.socketId === socket.id);
    if (pi >= 0) socket.emit('state', getCardState(pi));
    else socket.emit('state', getCardState(-1));
  } else {
    socket.emit('state', { phase: 'idle' });
  }

  socket.on('rejoin', (sessionId) => {
    if (!cardGame) return;
    const pi = cardGame.players.findIndex(p => p.sessionId === sessionId);
    if (pi < 0) return;
    const p = cardGame.players[pi];
    if (p.disconnectTimer) { clearTimeout(p.disconnectTimer); p.disconnectTimer = null; }
    p.socketId = socket.id;
    p.connected = true;
    clog(`REJOIN: ${p.name}`);
    broadcastCG();
  });

  socket.on('create', ({ name }) => {
    if (cardGame) { socket.emit('error_msg', 'A game already exists.'); return; }
    const sid = crypto.randomUUID();
    cardGame = newCG(sid, name);
    cardGame.players[0].socketId = socket.id;
    socket.emit('session', sid);
    clog(`CREATED by ${name}`);
    broadcastCG();
  });

  socket.on('join', ({ name }) => {
    if (!cardGame || cardGame.phase !== 'lobby') { socket.emit('error_msg', 'No lobby.'); return; }
    if (cardGame.players.length >= 2) { socket.emit('error_msg', 'Full.'); return; }
    const sid = crypto.randomUUID();
    const p = newCardPlayer(sid, name);
    p.socketId = socket.id;
    cardGame.players.push(p);
    socket.emit('session', sid);
    clog(`JOINED: ${name}`);
    broadcastCG();
  });

  socket.on('start', (sessionId) => {
    if (!cardGame || cardGame.phase !== 'lobby') return;
    if (cardGame.players[0].sessionId !== sessionId) return;
    if (cardGame.players.length < 2) { socket.emit('error_msg', 'Need 2 players.'); return; }
    cardGame.phase = 'playing';
    cardGame.deck = createDeck();
    for (const p of cardGame.players) p.hand = drawCards(5);
    cardGame.currentPlayerIndex = 0;
    clog('GAME STARTED');
    startCardTurn();
  });

  socket.on('play_card', ({ sessionId, cardId, color, asBank }) => {
    if (!cardGame || cardGame.phase !== 'playing') return;
    const pi = cardGame.players.findIndex(p => p.sessionId === sessionId);
    if (pi < 0 || pi !== cardGame.currentPlayerIndex) return;
    if (cardGame.turnPhase !== 'playing' || cardGame.actionsLeft <= 0 || cardGame.pendingAction) return;
    const player = cardGame.players[pi];
    const ci = player.hand.findIndex(c => c.id === cardId);
    if (ci < 0) return;
    const card = player.hand[ci];
    resetCGIdle();

    // Bank an action card for its money value
    if (asBank && card.type === 'action' && card.bankValue > 0) {
      player.hand.splice(ci, 1);
      player.bank.push({ ...card, type: 'money', value: card.bankValue, originalAction: card.action });
      cardGame.lastEvent = { type: 'bank_action', player: player.name, action: card.action, value: card.bankValue };
      clog(`${player.name} banked ${card.action} as $${card.bankValue}`);
      if (!useCardAction()) broadcastCG();
      return;
    }

    if (card.type === 'property') {
      player.hand.splice(ci, 1);
      player.properties[card.color].push(card);
      cardGame.lastEvent = { type: 'play_property', player: player.name, color: card.color };
      clog(`${player.name} played ${card.color} property`);
      if (!useCardAction()) broadcastCG();

    } else if (card.type === 'money') {
      player.hand.splice(ci, 1);
      player.bank.push(card);
      cardGame.lastEvent = { type: 'play_money', player: player.name, value: card.value };
      clog(`${player.name} banked $${card.value}`);
      if (!useCardAction()) broadcastCG();

    } else if (card.type === 'action' && card.action === 'wild') {
      if (!color || !CARD_COLORS.includes(color)) {
        cardGame.pendingAction = { type: 'wild_color', cardId: card.id };
        broadcastCG();
        return;
      }
      player.hand.splice(ci, 1);
      player.properties[color].push({ ...card, assignedColor: color });
      cardGame.lastEvent = { type: 'play_wild', player: player.name, color };
      clog(`${player.name} wild → ${color}`);
      if (!useCardAction()) broadcastCG();

    } else if (card.type === 'action' && card.action === 'rent') {
      const valid = CARD_COLORS.filter(c => player.properties[c].length > 0);
      if (valid.length === 0) { socket.emit('error_msg', 'No properties to rent.'); return; }
      player.hand.splice(ci, 1);
      cardGame.discard.push(card);
      cardGame.actionsLeft--;
      cardGame.pendingAction = { type: 'rent_color', actingPlayer: pi, validColors: valid };
      clog(`${player.name} played Rent`);
      broadcastCG();

    } else if (card.type === 'action' && card.action === 'steal') {
      const oi = oppIdx(pi);
      const opp = cardGame.players[oi];
      const targets = [];
      for (const c of CARD_COLORS) {
        if (!setComplete(opp.properties[c], c)) opp.properties[c].forEach(pc => targets.push({ ...pc, fromColor: c }));
      }
      if (targets.length === 0) { socket.emit('error_msg', 'Nothing to steal.'); return; }
      player.hand.splice(ci, 1);
      cardGame.discard.push(card);
      cardGame.actionsLeft--;
      cardGame.pendingAction = { type: 'steal_target', actingPlayer: pi, targets };
      clog(`${player.name} played Steal`);
      broadcastCG();

    } else if (card.type === 'action' && card.action === 'swap') {
      const oi = oppIdx(pi);
      const mine = [], theirs = [];
      for (const c of CARD_COLORS) {
        if (!setComplete(player.properties[c], c)) player.properties[c].forEach(pc => mine.push({ ...pc, fromColor: c }));
        if (!setComplete(cardGame.players[oi].properties[c], c)) cardGame.players[oi].properties[c].forEach(pc => theirs.push({ ...pc, fromColor: c }));
      }
      if (mine.length === 0 || theirs.length === 0) { socket.emit('error_msg', 'Not enough to swap.'); return; }
      player.hand.splice(ci, 1);
      cardGame.discard.push(card);
      cardGame.actionsLeft--;
      cardGame.pendingAction = { type: 'swap_own', actingPlayer: pi, mine, theirs };
      clog(`${player.name} played Swap`);
      broadcastCG();

    } else if (card.type === 'action' && card.action === 'passgo') {
      player.hand.splice(ci, 1);
      cardGame.discard.push(card);
      const drawn = drawCards(2);
      player.hand.push(...drawn);
      cardGame.lastEvent = { type: 'passgo', player: player.name, drew: drawn.length };
      clog(`${player.name} Pass Go, drew ${drawn.length}`);
      if (!useCardAction()) broadcastCG();

    } else if (card.type === 'action' && card.action === 'debtcollector') {
      player.hand.splice(ci, 1);
      cardGame.discard.push(card);
      const oi = oppIdx(pi);
      const opp = cardGame.players[oi];
      const hasBlock = opp.hand.some(c => c.type === 'action' && c.action === 'block');
      if (hasBlock) {
        cardGame.pendingAction = { type: 'block_prompt', actingPlayer: pi, targetPlayer: oi, actionType: 'debtcollector', amount: 5 };
        cardGame.blockTimer = setTimeout(() => { if (cardGame?.pendingAction?.type === 'block_prompt') resolveCardAction(); }, BLOCK_TIMEOUT);
        if (!useCardAction()) broadcastCG();
      } else {
        startRentPay(pi, oi, null, 5);
        cardGame.lastEvent = { type: 'debtcollector', player: player.name, target: opp.name, amount: 5 };
        clog(`${player.name} Debt Collector $5 from ${opp.name}`);
        useCardAction();
      }

    } else if (card.type === 'action' && card.action === 'birthday') {
      player.hand.splice(ci, 1);
      cardGame.discard.push(card);
      const oi = oppIdx(pi);
      const opp = cardGame.players[oi];
      const hasBlock = opp.hand.some(c => c.type === 'action' && c.action === 'block');
      if (hasBlock) {
        cardGame.pendingAction = { type: 'block_prompt', actingPlayer: pi, targetPlayer: oi, actionType: 'birthday', amount: 2 };
        cardGame.blockTimer = setTimeout(() => { if (cardGame?.pendingAction?.type === 'block_prompt') resolveCardAction(); }, BLOCK_TIMEOUT);
        if (!useCardAction()) broadcastCG();
      } else {
        startRentPay(pi, oi, null, 2);
        cardGame.lastEvent = { type: 'birthday', player: player.name, target: opp.name, amount: 2 };
        clog(`${player.name} Birthday $2 from ${opp.name}`);
        useCardAction();
      }

    } else if (card.type === 'action' && card.action === 'doublerent') {
      // Double rent requires at least 2 actions (1 for this + 1 for the rent card)
      if (cardGame.actionsLeft < 2) {
        socket.emit('error_msg', 'Need at least 2 actions left to play Double Rent (1 for Double Rent + 1 for Rent card)');
        return;
      }
      // Double rent: hold in pending, next rent card doubles
      player.hand.splice(ci, 1);
      cardGame.discard.push(card);
      cardGame.doubleRentActive = true;
      cardGame.lastEvent = { type: 'doublerent', player: player.name };
      clog(`${player.name} played Double Rent`);
      if (!useCardAction()) broadcastCG();

    } else if (card.type === 'action' && card.action === 'dealbreaker') {
      const oi = oppIdx(pi);
      const opp = cardGame.players[oi];
      const completedColors = CARD_COLORS.filter(c => setComplete(opp.properties[c], c));
      if (completedColors.length === 0) {
        socket.emit('error_msg', 'Opponent has no complete sets to break!');
        return;
      }
      player.hand.splice(ci, 1);
      cardGame.discard.push(card);
      cardGame.pendingAction = { type: 'dealbreaker_target', actingPlayer: pi, targetPlayer: oi, validColors: completedColors };
      clog(`${player.name} Deal Breaker — choosing set`);
      if (!useCardAction()) broadcastCG();

    } else if (card.type === 'action' && card.action === 'block') {
      socket.emit('error_msg', 'Block is reactive only.');
    }
  });

  socket.on('choose', ({ sessionId, choice }) => {
    if (!cardGame || !cardGame.pendingAction) return;
    const pi = cardGame.players.findIndex(p => p.sessionId === sessionId);
    if (pi < 0) return;
    const pa = cardGame.pendingAction;
    const player = cardGame.players[pi];
    resetCGIdle();

    if (pa.type === 'wild_color' && pi === cardGame.currentPlayerIndex) {
      if (!CARD_COLORS.includes(choice)) return;
      const ci = player.hand.findIndex(c => c.id === pa.cardId);
      if (ci < 0) return;
      const card = player.hand.splice(ci, 1)[0];
      player.properties[choice].push({ ...card, assignedColor: choice });
      cardGame.lastEvent = { type: 'play_wild', player: player.name, color: choice };
      cardGame.pendingAction = null;
      clog(`${player.name} wild → ${choice}`);
      if (!useCardAction()) broadcastCG();

    } else if (pa.type === 'rent_color' && pi === pa.actingPlayer) {
      if (!pa.validColors.includes(choice)) return;
      const count = player.properties[choice].length;
      let amount = (RENT_TABLE[choice] && RENT_TABLE[choice][count]) || count;
      if (cardGame.doubleRentActive) { amount *= 2; cardGame.doubleRentActive = false; }
      const oi = oppIdx(pi);
      const opp = cardGame.players[oi];
      const hasBlock = opp.hand.some(c => c.type === 'action' && c.action === 'block');
      if (hasBlock) {
        cardGame.pendingAction = { type: 'block_prompt', actingPlayer: pi, targetPlayer: oi, actionType: 'rent', color: choice, amount };
        cardGame.blockTimer = setTimeout(() => { if (cardGame?.pendingAction?.type === 'block_prompt') resolveCardAction(); }, BLOCK_TIMEOUT);
        broadcastCG();
      } else {
        startRentPay(pi, oi, choice, amount);
        clog(`Rent ${choice} $${amount} — ${opp.name} must pay`);
      }

    } else if (pa.type === 'steal_target' && pi === pa.actingPlayer) {
      const tid = choice;
      const oi = oppIdx(pi);
      const opp = cardGame.players[oi];
      let targetColor = null;
      for (const c of CARD_COLORS) {
        if (!setComplete(opp.properties[c], c) && opp.properties[c].some(x => x.id === tid)) { targetColor = c; break; }
      }
      if (!targetColor) return;
      const hasBlock = opp.hand.some(c => c.type === 'action' && c.action === 'block');
      if (hasBlock) {
        cardGame.pendingAction = { type: 'block_prompt', actingPlayer: pi, targetPlayer: oi, actionType: 'steal', targetCardId: tid, targetColor };
        cardGame.blockTimer = setTimeout(() => { if (cardGame?.pendingAction?.type === 'block_prompt') resolveCardAction(); }, BLOCK_TIMEOUT);
        broadcastCG();
      } else {
        const idx = opp.properties[targetColor].findIndex(x => x.id === tid);
        if (idx >= 0) {
          const stolen = opp.properties[targetColor].splice(idx, 1)[0];
          const dest = stolen.assignedColor || stolen.color || targetColor;
          player.properties[dest].push(stolen);
          cardGame.lastEvent = { type: 'steal', player: player.name, target: opp.name, color: dest };
          clog(`${player.name} stole ${dest} from ${opp.name}`);
        }
        cardGame.pendingAction = null;
        if (!checkCardWin()) { if (cardGame.actionsLeft <= 0) endCardTurn(); else broadcastCG(); }
      }

    } else if (pa.type === 'swap_own' && pi === pa.actingPlayer) {
      let valid = false;
      for (const c of CARD_COLORS) {
        if (!setComplete(player.properties[c], c) && player.properties[c].some(x => x.id === choice)) { valid = true; break; }
      }
      if (!valid) return;
      cardGame.pendingAction = { ...pa, type: 'swap_target', myCardId: choice };
      broadcastCG();

    } else if (pa.type === 'swap_target' && pi === pa.actingPlayer) {
      const oi = oppIdx(pi);
      const opp = cardGame.players[oi];
      let targetColor = null;
      for (const c of CARD_COLORS) {
        if (!setComplete(opp.properties[c], c) && opp.properties[c].some(x => x.id === choice)) { targetColor = c; break; }
      }
      if (!targetColor) return;
      const hasBlock = opp.hand.some(c => c.type === 'action' && c.action === 'block');
      if (hasBlock) {
        cardGame.pendingAction = { type: 'block_prompt', actingPlayer: pi, targetPlayer: oi, actionType: 'swap', myCardId: pa.myCardId, theirCardId: choice };
        cardGame.blockTimer = setTimeout(() => { if (cardGame?.pendingAction?.type === 'block_prompt') resolveCardAction(); }, BLOCK_TIMEOUT);
        broadcastCG();
      } else {
        executeSwap(pi, pa.myCardId, choice);
        cardGame.lastEvent = { type: 'swap', player: player.name, target: opp.name };
        cardGame.pendingAction = null;
        if (!checkCardWin()) { if (cardGame.actionsLeft <= 0) endCardTurn(); else broadcastCG(); }
      }

    } else if (pa.type === 'dealbreaker_target' && pi === pa.actingPlayer) {
      if (!pa.validColors.includes(choice)) return;
      const oi = pa.targetPlayer;
      const opp = cardGame.players[oi];
      const hasBlock = opp.hand.some(c => c.type === 'action' && c.action === 'block');
      if (hasBlock) {
        cardGame.pendingAction = { type: 'block_prompt', actingPlayer: pi, targetPlayer: oi, actionType: 'dealbreaker', color: choice };
        cardGame.blockTimer = setTimeout(() => { if (cardGame?.pendingAction?.type === 'block_prompt') resolveCardAction(); }, BLOCK_TIMEOUT);
        broadcastCG();
      } else {
        executeDealBreaker(pi, oi, choice);
        cardGame.pendingAction = null;
        if (!checkCardWin()) { if (cardGame.actionsLeft <= 0) endCardTurn(); else broadcastCG(); }
      }

    } else if (pa.type === 'block_prompt' && pi === pa.targetPlayer) {
      if (cardGame.blockTimer) { clearTimeout(cardGame.blockTimer); cardGame.blockTimer = null; }
      if (choice === 'block') {
        const bi = player.hand.findIndex(c => c.type === 'action' && c.action === 'block');
        if (bi >= 0) {
          cardGame.discard.push(player.hand.splice(bi, 1)[0]);
          cardGame.lastEvent = { type: 'blocked', player: player.name, actionType: pa.actionType };
          clog(`${player.name} BLOCKED ${pa.actionType}`);
        }
        cardGame.pendingAction = null;
        if (cardGame.actionsLeft <= 0) endCardTurn();
        else broadcastCG();
      } else {
        resolveCardAction();
      }
    } else if (pa.type === 'rent_pay' && pi === pa.targetPlayer) {
      if (choice.action === 'toggle_money') {
        const idx = pa.selectedMoney.indexOf(choice.id);
        if (idx >= 0) pa.selectedMoney.splice(idx, 1);
        else pa.selectedMoney.push(choice.id);
        broadcastCG();
      } else if (choice.action === 'toggle_property') {
        const idx = pa.selectedProperties.indexOf(choice.id);
        if (idx >= 0) pa.selectedProperties.splice(idx, 1);
        else pa.selectedProperties.push(choice.id);
        broadcastCG();
      } else if (choice.action === 'confirm_pay') {
        const target = cardGame.players[pa.targetPlayer];
        const actor = cardGame.players[pa.actingPlayer];
        const selectedVal = pa.selectedMoney.reduce((s, mid) => {
          const mc = target.bank.find(c => c.id === mid);
          return s + (mc ? mc.value : 0);
        }, 0) + pa.selectedProperties.length;
        const maxAssets = totalAssets(target);
        if (selectedVal < pa.amount && selectedVal < maxAssets) return; // must pay enough or all they have
        payRentManual(target, actor, pa.selectedMoney, pa.selectedProperties);
        cardGame.lastEvent = { type: 'rent', player: actor.name, target: target.name, color: pa.color, amount: pa.amount };
        clog(`Rent paid: ${target.name} paid $${selectedVal} to ${actor.name}`);
        cardGame.pendingAction = null;
        if (!checkCardWin()) { if (cardGame.actionsLeft <= 0) endCardTurn(); else broadcastCG(); }
      }
    }
  });

  socket.on('end_turn', (sessionId) => {
    if (!cardGame || cardGame.phase !== 'playing') return;
    const pi = cardGame.players.findIndex(p => p.sessionId === sessionId);
    if (pi < 0 || pi !== cardGame.currentPlayerIndex) return;
    if (cardGame.pendingAction) return;
    endCardTurn();
  });

  socket.on('discard_card', ({ sessionId, cardId }) => {
    if (!cardGame || cardGame.turnPhase !== 'discarding') return;
    const pi = cardGame.players.findIndex(p => p.sessionId === sessionId);
    if (pi < 0 || pi !== cardGame.currentPlayerIndex) return;
    const player = cardGame.players[pi];
    const ci = player.hand.findIndex(c => c.id === cardId);
    if (ci < 0) return;
    cardGame.discard.push(player.hand.splice(ci, 1)[0]);
    clog(`${player.name} discarded`);
    if (player.hand.length <= HAND_LIMIT) nextCardTurn();
    else broadcastCG();
  });

  socket.on('reset', () => resetCG());

  socket.on('disconnect', () => {
    if (!cardGame) return;
    const p = cardGame.players.find(x => x.socketId === socket.id);
    if (!p) return;
    clog(`DISCONNECT: ${p.name}`);
    if (cardGame.phase === 'lobby') {
      cardGame.players = cardGame.players.filter(x => x.socketId !== socket.id);
      if (cardGame.players.length === 0) resetCG();
      else broadcastCG();
    } else if (cardGame.phase === 'playing') {
      p.connected = false;
      p.disconnectTimer = setTimeout(() => {
        if (!cardGame) return;
        clog(`Grace expired: ${p.name}`);
        cardGame.phase = 'finished';
        const other = cardGame.players.find(x => x.connected);
        cardGame.winner = other ? other.name : 'disconnect';
        broadcastCG();
        setTimeout(resetCG, 15000);
      }, 15 * 60 * 1000);
      broadcastCG();
    }
  });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const nets = require('os').networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIP = net.address;
        break;
      }
    }
  }
  console.log(`🎮 Game Portal running!`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIP}:${PORT}`);
});
