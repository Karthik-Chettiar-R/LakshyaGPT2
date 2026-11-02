const adjectives = ["Swift", "Bright", "Curious", "Clever", "Cosmic", "Mighty", "Lucky", "Bold"];
const animals = ["Fox", "Owl", "Panda", "Tiger", "Dolphin", "Raven", "Koala", "Falcon"];
const rooms = new Map();

function randomUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective}${animal}${Math.floor(10 + Math.random() * 90)}`;
}

function getRoom(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, new Map());
  }
  return rooms.get(roomCode);
}

function deleteRoom(roomCode) {
  rooms.delete(roomCode);
}

function getPlayers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return [];

  return [...room.entries()].map(([id, player]) => ({
    id,
    username: player.username,
    ready: player.ready,
    isHost: id === room.hostId,
  }));
}

function isHost(roomCode, playerId) {
  const room = rooms.get(roomCode);
  return room?.hostId === playerId;
}

function setPlayerReady(roomCode, playerId, ready) {
  const room = rooms.get(roomCode);
  const player = room?.get(playerId);
  if (!player || room.hostId === playerId) return false;

  player.ready = ready;
  return true;
}

function allPlayersReady(roomCode) {
  const room = rooms.get(roomCode);
  return Boolean(room && [...room.values()].every((player) => player.ready));
}

function broadcastMessage(roomCode, message) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const payload = JSON.stringify(message);
  for (const player of room.values()) {
    if (player.socket.readyState === 1) {
      player.socket.send(payload);
    }
  }
}

function broadcastRoom(roomCode) {
  broadcastMessage(roomCode, {
    type: "room_state",
    players: getPlayers(roomCode),
    hostId: rooms.get(roomCode)?.hostId,
  });
}

module.exports = {
  broadcastMessage,
  broadcastRoom,
  deleteRoom,
  getPlayers,
  getRoom,
  allPlayersReady,
  isHost,
  randomUsername,
  setPlayerReady,
};
