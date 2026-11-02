const PLAYER_ID_STORAGE_KEY = "lakshya-gpt-player-id";

export function getPlayerId() {
  if (typeof window === "undefined") return "";

  const savedId = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY);
  if (savedId) return savedId;

  const playerId = window.crypto.randomUUID();
  window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, playerId);
  return playerId;
}
