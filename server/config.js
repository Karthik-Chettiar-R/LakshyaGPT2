const dev = process.argv[2] !== "start";
const hostname = "localhost";
const port = Number(process.env.PORT) || 3000;

const GAME_ROUNDS = 10;
const ROUND_DURATION_MS = 30_000;

module.exports = {
  dev,
  hostname,
  port,
  GAME_ROUNDS,
  ROUND_DURATION_MS,
};
