# Change Log

## 2026-11-01

- Created this change log to record all implementation changes for Game Mode.
- Added a dedicated Gemini-backed `/api/game` endpoint that returns two plausible statements, the true side, and a concise explanation for each round.
- Added the top-level Game Mode button, 10-round game flow, timer, score tracker, answer feedback, restart controls, responsive statement cards, and game-specific styling.
- Validation: `npm run build` passes. `npm run lint` still reports pre-existing issues in the original chat implementation; no new Game Mode lint errors were reported.
- Moved the Game Mode button to the far-left position in the main header, before the LakshyaGPT brand.
- Enlarged the Game Mode button to make it substantially more prominent.
- Changed scoring to award up to 10 points per correct question based on remaining time, for a maximum of 100 points across 10 rounds.
- Prevented the timer from running while Gemini is generating a question; each 30-second timer now starts only after the new question is received.
- Added a Game Mode selection screen with yellow Single Player and green Multiplayer square cards.
- Connected Single Player to the existing game flow and added a `/multiplayer` page with Create a room and Join a room choices.
- Validation: `npm run build` passes and recognizes `/multiplayer` as a route.
- Added a WebSocket-backed room server with six-digit room creation, server-assigned random usernames, room membership broadcasts, and username rename messages.
- Added dynamic `/multiplayer/[roomCode]` room pages with copyable invite links, a highlighted editable owner row, and other players listed below as they join.
- Validation: `npm install`, `npm run build`, `node --check server.js`, and a live WebSocket handshake to room `123456` all passed.
- Fixed development HMR WebSocket failures by delegating non-room upgrade requests, including `/_next/webpack-hmr`, to Next.js instead of destroying them.
- Added Join a room functionality with a six-digit code input, validation, and navigation to the matching multiplayer waiting room.
- Added a Start game button above the waiting-room player list; starting broadcasts to all connected players and opens the existing game flow.
- Prevented transient initial WebSocket error events from showing the room server error screen before the connection has actually failed.
- Reworked multiplayer rooms to use server-authoritative questions, answers, scores, synchronized rounds, live rankings, and final podium standings.
- Split the WebSocket server into configuration, room management, game state, and transport modules; `server.js` now only bootstraps Next.js and the modular server.
- Restricted game starts to the room host and added ready toggles for non-host players; the server now requires every player to be ready before starting.
- Updated the waiting-room labels so hosts always see `Start game`, while participants toggle between `Not ready` and `Ready`.
- Added a persistent browser player ID and used it for room identity, host ownership, readiness, and reconnect handling.
- Restarted the development server with the updated WebSocket protocol and verified stable host identity plus ready-state broadcasts across two clients.
- Delayed multiplayer ranking updates until all players answer or the round timer expires, while highlighting each player's own selection immediately.
