const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
    idleTimer: null,
    turnTimer: null
  };
}

function resetGame() {
  if (game && game.idleTimer) clearTimeout(game.idleTimer);
  if (game && game.turnTimer) clearTimeout(game.turnTimer);
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
  if (allInBase) {
    if (Math.random() < 0.333) return 6;
  }
  return Math.floor(Math.random() * 6) + 1;
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

function nextTurn(extraTurn) {
  if (game.turnTimer) { clearTimeout(game.turnTimer); game.turnTimer = null; }
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
  broadcastState();
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
    lastCapture: game.lastCapture || null
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
    game.phase = 'playing';
    for (const p of game.players) {
      game.tokens[p.color] = [0, 0, 0, 0];
    }
    game.currentPlayerIndex = 0;
    resetIdleTimer();
    log(`GAME STARTED with ${game.players.length} players:`,
      game.players.map(p => `${p.name}(${p.color})`));
    broadcastState();
  });

  socket.on('roll', (sessionId) => {
    if (!game || game.phase !== 'playing') return;
    const playerIdx = game.players.findIndex(p => p.sessionId === sessionId);
    if (playerIdx < 0 || playerIdx !== game.currentPlayerIndex) return;
    if (game.diceRolled) return;

    const player = game.players[playerIdx];
    const value = rollDice(player.color);
    game.diceValue = value;
    game.diceRolled = true;
    log(`ROLL: ${player.name}(${player.color}) rolled ${value}`);

    const movable = [];
    for (let i = 0; i < 4; i++) {
      if (canMoveToken(player.color, i, value)) movable.push(i);
    }
    log(`  movable tokens: ${JSON.stringify(movable)}`);

    if (movable.length === 0) {
      broadcastState();
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
        const captured = moveToken(player.color, movable[0], value);
        if (checkWin(player.color)) {
          game.phase = 'finished';
          game.winner = player.color;
          log(`GAME OVER: ${player.name}(${player.color}) wins!`);
          broadcastState();
          setTimeout(resetGame, 30000);
        } else {
          const extra = value === 6 || captured;
          log(`  auto-move token ${movable[0]}, extra turn: ${extra}`);
          nextTurn(extra);
        }
      }, 1000);
    } else {
      broadcastState();
    }
  });

  socket.on('move', ({ sessionId, tokenIndex: tokenIdx }) => {
    if (!game || game.phase !== 'playing') return;
    const playerIdx = game.players.findIndex(p => p.sessionId === sessionId);
    if (playerIdx < 0 || playerIdx !== game.currentPlayerIndex) return;
    if (!game.diceRolled || game.diceValue === null) return;

    const player = game.players[playerIdx];
    if (!canMoveToken(player.color, tokenIdx, game.diceValue)) {
      socket.emit('error_msg', 'Invalid move.');
      return;
    }

    log(`MOVE: ${player.name}(${player.color}) token ${tokenIdx} with dice ${game.diceValue}`);
    const captured = moveToken(player.color, tokenIdx, game.diceValue);

    if (checkWin(player.color)) {
      game.phase = 'finished';
      game.winner = player.color;
      log(`GAME OVER: ${player.name}(${player.color}) wins!`);
      broadcastState();
      setTimeout(resetGame, 30000);
    } else {
      const extra = game.diceValue === 6 || captured;
      log(`  extra turn: ${extra}`);
      nextTurn(extra);
    }
  });

  socket.on('reset', () => {
    log(`RESET requested`);
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
        nextTurn(value === 6 || captured);
      }
    } else {
      broadcastState();
    }
  });

  socket.on('disconnect', () => {
    log(`DISCONNECT socket=${socket.id}`);
    if (!game) return;
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player) { log('  not a player'); return; }
    log(`  player: ${player.name}(${player.color}) phase=${game.phase}`);

    if (game.phase === 'lobby') {
      game.players = game.players.filter(p => p.socketId !== socket.id);
      game.players.forEach((p, i) => p.color = COLORS[i]);
      log(`  removed from lobby, ${game.players.length} players remain`);
      if (game.players.length === 0) {
        log(`  lobby empty, resetting game`);
        resetGame();
      }
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
