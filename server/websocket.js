const crypto = require("node:crypto");
const { WebSocketServer } = require("ws");
const {
  advanceRound,
  createGame,
  deleteGame,
  getGame,
  isGameQuestion,
  removePlayer,
  sendGameStarted,
  submitAnswer,
} = require("./game");
const {
  broadcastRoom,
  deleteRoom,
  getRoom,
  allPlayersReady,
  isHost,
  randomUsername,
  setPlayerReady,
} = require("./rooms");

function parseConnectionDetails(request, hostname, port) {
  const requestUrl = new URL(request.url, `http://${hostname}:${port}`);
  return {
    roomCode: requestUrl.searchParams.get("room"),
    userId: requestUrl.searchParams.get("userId"),
  };
}

function handleMessage(rawMessage, roomCode, playerId, room, socket) {
  try {
    const message = JSON.parse(rawMessage.toString());
    const player = room.get(playerId);
    if (!player) return;

    if (message.type === "start_game") {
      if (!isHost(roomCode, playerId)) {
        socket.send(JSON.stringify({ type: "error", message: "Only the host can start the game." }));
        return;
      }
      if (!allPlayersReady(roomCode)) {
        socket.send(JSON.stringify({ type: "error", message: "Everyone must be ready before the game starts." }));
        return;
      }
      createGame(roomCode, playerId, message.question, [...room.keys()]);
      return;
    }

    if (message.type === "ready") {
      if (setPlayerReady(roomCode, playerId, message.ready === true)) {
        broadcastRoom(roomCode);
      }
      return;
    }

    if (message.type === "answer") {
      submitAnswer(roomCode, playerId, message.round, message.side, room.size);
      return;
    }

    if (message.type === "next_round") {
      advanceRound(roomCode, playerId, message.round, message.question);
      return;
    }

    if (message.type !== "rename") return;

    const username = typeof message.username === "string"
      ? message.username.trim().slice(0, 24)
      : "";
    if (username) {
      player.username = username;
      broadcastRoom(roomCode);
    }
  } catch {
    socket.send(JSON.stringify({ type: "error", message: "Invalid room message." }));
  }
}

function handleDisconnect(roomCode, playerId, room, socket) {
  const currentPlayer = room.get(playerId);
  if (!currentPlayer || currentPlayer.socket !== socket) return;

  room.delete(playerId);
  if (room.size === 0) {
    deleteGame(roomCode);
    deleteRoom(roomCode);
    return;
  }

  if (room.hostId === playerId) {
    const [nextHostId, nextHost] = room.entries().next().value || [];
    if (nextHostId && nextHost) {
      room.hostId = nextHostId;
      nextHost.ready = true;
    }
  }
  removePlayer(roomCode, playerId, room.size);
  broadcastRoom(roomCode);
}

function createWebSocketServer({ server, nextUpgradeHandler, hostname, port }) {
  const websocketServer = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url && request.url.startsWith("/_ws")) {
      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        websocketServer.emit("connection", websocket, request);
      });
    } else {
      nextUpgradeHandler(request, socket, head);
    }
  });

  websocketServer.on("connection", (socket, request) => {
    const { roomCode, userId } = parseConnectionDetails(request, hostname, port);
    const playerId = /^[0-9a-f-]{36}$/i.test(userId || "") ? userId : crypto.randomUUID();

    if (!roomCode || !/^\d{6}$/.test(roomCode)) {
      socket.close(1008, "Invalid room code");
      return;
    }

    const room = getRoom(roomCode);
    const previousPlayer = room.get(playerId);
    if (previousPlayer) previousPlayer.socket.close(1000, "Reconnected");
    if (!room.hostId) room.hostId = playerId;
    room.set(playerId, {
      socket,
      username: randomUsername(),
      ready: room.hostId === playerId,
    });
    socket.send(JSON.stringify({ type: "welcome", playerId }));
    broadcastRoom(roomCode);
    if (getGame(roomCode)) sendGameStarted(roomCode);

    socket.on("message", (rawMessage) => {
      handleMessage(rawMessage, roomCode, playerId, room, socket);
    });
    socket.on("close", () => {
      handleDisconnect(roomCode, playerId, room, socket);
    });
  });

  return websocketServer;
}

module.exports = { createWebSocketServer };
