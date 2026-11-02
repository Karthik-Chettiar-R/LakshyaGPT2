const { GAME_ROUNDS, ROUND_DURATION_MS } = require("./config");
const { broadcastMessage, getPlayers } = require("./rooms");

const games = new Map();

function isGameQuestion(question) {
  return question
    && typeof question.leftStatement === "string"
    && typeof question.rightStatement === "string"
    && (question.correctSide === "left" || question.correctSide === "right")
    && typeof question.explanation === "string";
}

function getGame(roomCode) {
  return games.get(roomCode);
}

function getRankings(roomCode) {
  const game = games.get(roomCode);
  if (!game) return [];

  return getPlayers(roomCode)
    .map((player) => ({
      ...player,
      score: game.scores.get(player.id) || 0,
    }))
    .sort((left, right) => right.score - left.score || left.username.localeCompare(right.username));
}

function sendGameStarted(roomCode) {
  const game = games.get(roomCode);
  if (!game) return;

  broadcastMessage(roomCode, {
    type: "game_started",
    hostId: game.hostId,
    round: game.round,
    question: game.question,
    rankings: getRankings(roomCode),
  });
}

function finishRound(roomCode) {
  const game = games.get(roomCode);
  if (!game || game.roundFinished) return;

  game.roundFinished = true;
  if (game.timer) clearTimeout(game.timer);

  const rankings = getRankings(roomCode);
  broadcastMessage(roomCode, {
    type: "round_result",
    round: game.round,
    question: game.question,
    answers: Object.fromEntries(game.answers),
    rankings,
  });

  if (game.round === GAME_ROUNDS) {
    game.finished = true;
    broadcastMessage(roomCode, { type: "game_over", rankings });
  }
}

function startRound(roomCode, question) {
  const game = games.get(roomCode);
  if (!game || !isGameQuestion(question)) return false;

  game.question = question;
  game.round += 1;
  game.answers = new Map();
  game.roundFinished = false;
  game.startedAt = Date.now();
  game.timer = setTimeout(() => finishRound(roomCode), ROUND_DURATION_MS);
  broadcastMessage(roomCode, {
    type: "next_round",
    round: game.round,
    question: game.question,
  });
  return true;
}

function createGame(roomCode, hostId, question, playerIds) {
  if (games.has(roomCode) || !isGameQuestion(question)) return false;

  const scores = new Map(playerIds.map((playerId) => [playerId, 0]));
  games.set(roomCode, {
    hostId,
    round: 1,
    question,
    scores,
    answers: new Map(),
    startedAt: Date.now(),
    roundFinished: false,
    finished: false,
    timer: setTimeout(() => finishRound(roomCode), ROUND_DURATION_MS),
  });
  sendGameStarted(roomCode);
  return true;
}

function submitAnswer(roomCode, playerId, round, side, playerCount) {
  const game = games.get(roomCode);
  const validSide = side === "left" || side === "right" || side === "timeout";
  if (
    !game
    || game.finished
    || game.roundFinished
    || round !== game.round
    || game.answers.has(playerId)
    || !validSide
  ) return false;

  const elapsed = Math.min(ROUND_DURATION_MS, Math.max(0, Date.now() - game.startedAt));
  const correct = side === game.question.correctSide;
  const points = correct
    ? Math.max(1, Math.ceil(((ROUND_DURATION_MS - elapsed) / ROUND_DURATION_MS) * 10))
    : 0;
  game.scores.set(playerId, (game.scores.get(playerId) || 0) + points);
  game.answers.set(playerId, { side, correct, points });

  if (game.answers.size >= playerCount) finishRound(roomCode);
  return true;
}

function advanceRound(roomCode, playerId, round, question) {
  const game = games.get(roomCode);
  if (
    !game
    || game.finished
    || !game.roundFinished
    || game.hostId !== playerId
    || round !== game.round
  ) return false;

  return startRound(roomCode, question);
}

function removePlayer(roomCode, playerId, playerCount) {
  const game = games.get(roomCode);
  if (!game) return;

  game.scores.delete(playerId);
  if (game.answers.size >= playerCount && !game.roundFinished) {
    finishRound(roomCode);
  }
}

function deleteGame(roomCode) {
  const game = games.get(roomCode);
  if (game && game.timer) clearTimeout(game.timer);
  games.delete(roomCode);
}

module.exports = {
  advanceRound,
  createGame,
  deleteGame,
  getGame,
  getRankings,
  isGameQuestion,
  removePlayer,
  sendGameStarted,
  submitAnswer,
};
