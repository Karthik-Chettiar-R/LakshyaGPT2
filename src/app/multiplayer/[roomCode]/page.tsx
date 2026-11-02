"use client";

import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  Gamepad2,
  Pencil,
  Play,
  Trophy,
  UsersRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getPlayerId } from "@/lib/player-id";

interface Player {
  id: string;
  username: string;
  ready: boolean;
  isHost: boolean;
}

interface GameQuestion {
  leftStatement: string;
  rightStatement: string;
  correctSide: "left" | "right";
  explanation: string;
}

interface Ranking extends Player {
  score: number;
}

type SelectedSide = "left" | "right" | "timeout" | null;
type RoomStatus = "waiting" | "playing" | "results" | "finished";

const ROUND_DURATION = 30;

export default function MultiplayerRoomPage() {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const roomCode = params.roomCode;
  const socketRef = useRef<WebSocket | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const hostIdRef = useRef<string | null>(null);
  const nextRoundTimeoutRef = useRef<number | null>(null);
  const timeoutSentRef = useRef(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [roomMessage, setRoomMessage] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [status, setStatus] = useState<RoomStatus>("waiting");
  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [selectedSide, setSelectedSide] = useState<SelectedSide>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [roundAnswers, setRoundAnswers] = useState<Record<string, {
    side: SelectedSide;
    correct: boolean;
    points: number;
  }>>({});

  const ownPlayer = players.find((player) => player.id === playerId);
  const ownRanking = rankings.find((ranking) => ranking.id === playerId);
  const isHost = ownPlayer?.isHost ?? hostId === playerId;
  const allPlayersReady = players.length > 0 && players.every((player) => player.ready);
  const answeredCorrectly = selectedSide !== null
    && selectedSide !== "timeout"
    && question?.correctSide === selectedSide;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const userId = getPlayerId();
    const socket = new WebSocket(
      `${protocol}//${window.location.host}/_ws?room=${roomCode}&userId=${encodeURIComponent(userId)}`,
    );
    socketRef.current = socket;
    let connected = false;
    let closed = false;

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data) as {
        type: string;
        playerId?: string;
        players?: Player[];
        hostId?: string;
        round?: number;
        question?: GameQuestion;
        rankings?: Ranking[];
        answers?: Record<string, {
          side: SelectedSide;
          correct: boolean;
          points: number;
        }>;
        message?: string;
      };

      if (message.type === "welcome" && message.playerId) {
        connected = true;
        playerIdRef.current = message.playerId;
        setPlayerId(message.playerId);
      }
      if (message.type === "room_state" && message.players) {
        setPlayers(message.players);
        setHostId(message.hostId || null);
        const currentPlayer = message.players.find((player) => player.id === playerIdRef.current);
        if (currentPlayer) setUsername(currentPlayer.username);
      }
      if (message.type === "error" && message.message) {
        setRoomMessage(message.message);
        setStarting(false);
      }
      if (message.type === "game_started" && message.question && message.round) {
        hostIdRef.current = message.hostId || null;
        setQuestion(message.question);
        setRound(message.round);
        setTimeLeft(ROUND_DURATION);
        setSelectedSide(null);
        timeoutSentRef.current = false;
        setRoundAnswers({});
        setRankings(message.rankings || []);
        setStatus("playing");
        setStarting(false);
      }
      if (message.type === "next_round" && message.question && message.round) {
        setQuestion(message.question);
        setRound(message.round);
        setTimeLeft(ROUND_DURATION);
        setSelectedSide(null);
        timeoutSentRef.current = false;
        setRoundAnswers({});
        setStatus("playing");
      }
      if (message.type === "round_result" && message.rankings && message.answers) {
        setRankings(message.rankings);
        setRoundAnswers(message.answers);
        const ownAnswer = playerIdRef.current ? message.answers[playerIdRef.current] : undefined;
        if (ownAnswer) setSelectedSide(ownAnswer.side);
        setStatus("results");

        if (
          hostIdRef.current === playerIdRef.current &&
          message.round &&
          message.round < 10
        ) {
          nextRoundTimeoutRef.current = window.setTimeout(() => {
            void loadQuestionAndSend("next_round", message.round);
          }, 2500);
        }
      }
      if (message.type === "game_over" && message.rankings) {
        setRankings(message.rankings);
        setStatus("finished");
      }
    });
    socket.addEventListener("error", () => {
      if (connected || closed) return;
      setConnectionError(null);
    });
    socket.addEventListener("close", () => {
      if (!connected && !closed) {
        setConnectionError("Could not connect to the room server. Please try again.");
      }
    });

    return () => {
      closed = true;
      if (nextRoundTimeoutRef.current) window.clearTimeout(nextRoundTimeoutRef.current);
      socket.close();
    };
  }, [roomCode]);

  useEffect(() => {
    if (status !== "playing" || selectedSide !== null || !question) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [question, selectedSide, status]);

  useEffect(() => {
    if (timeLeft === 0 && status === "playing" && selectedSide === null && !timeoutSentRef.current) {
      timeoutSentRef.current = true;
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "answer", round, side: "timeout" }));
      }
    }
  }, [round, selectedSide, status, timeLeft]);

  async function loadQuestionAndSend(type: "start_game" | "next_round", currentRound?: number) {
    try {
      const response = await fetch("/api/game", { method: "POST" });
      const data = await response.json() as GameQuestion & { error?: string };
      if (!response.ok || data.error) throw new Error(data.error || "Unable to prepare the next round.");
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type,
          question: data,
          ...(currentRound ? { round: currentRound } : {}),
        }));
      }
    } catch (error) {
      setStarting(false);
      setConnectionError(error instanceof Error ? error.message : "Unable to prepare the game.");
    }
  }

  const renamePlayer = () => {
    const nextUsername = username.trim().slice(0, 24);
    if (!nextUsername || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: "rename", username: nextUsername }));
    setEditing(false);
  };

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const startGame = () => {
    if (starting || status !== "waiting" || !isHost || !allPlayersReady) return;
    setStarting(true);
    void loadQuestionAndSend("start_game");
  };

  const toggleReady = () => {
    if (isHost || socketRef.current?.readyState !== WebSocket.OPEN || !ownPlayer) return;
    setRoomMessage(null);
    socketRef.current.send(JSON.stringify({ type: "ready", ready: !ownPlayer.ready }));
  };

  const submitAnswer = (side: "left" | "right" | "timeout") => {
    if (status !== "playing" || selectedSide !== null || timeLeft === 0) return;
    setSelectedSide(side);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "answer", round, side }));
    }
  };

  return (
    <main className="app-canvas game-canvas">
      <div className="bg-glow-orb top-right" />
      <div className="bg-glow-orb bottom-left" />

      <header className="header-bar">
        <div className="header-brand">
          <div className="brand-icon-box">
            <Gamepad2 style={{ width: "20px", height: "20px", color: "#fff" }} />
          </div>
          <h1 className="brand-title">Multiplayer Room</h1>
        </div>
        <button onClick={() => router.push("/")} className="btn-reset">
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          Exit Room
        </button>
      </header>

      <section className="game-scroll-area">
        <div className="game-wrapper room-page-wrapper">
          {status === "waiting" && (
            <>
              <div className="room-heading">
                <span className="game-eyebrow">Waiting room</span>
                <h2>Room {roomCode}</h2>
                <p>Share this room link with the other players.</p>
                <button onClick={() => void copyRoomCode()} className="room-code-copy">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Link copied" : "Copy invite link"}
                </button>
              </div>
              {connectionError ? (
                <div className="game-error glass-panel">
                  <p>{connectionError}</p>
                  <button onClick={() => window.location.reload()} className="btn-game-primary">
                    Try again
                  </button>
                </div>
              ) : (
                <div className="room-waiting-content">
                  {isHost ? (
                    <button
                      onClick={startGame}
                      className="btn-game-primary room-start-button"
                      type="button"
                      disabled={starting || !allPlayersReady}
                    >
                      <Play size={16} />
                      {starting ? "Preparing game..." : "Start game"}
                    </button>
                  ) : (
                    <button
                      onClick={toggleReady}
                      className="btn-game-primary room-start-button"
                      type="button"
                      disabled={!ownPlayer}
                    >
                      <Check size={16} />
                      {ownPlayer?.ready ? "Ready" : "Not ready"}
                    </button>
                  )}
                  {roomMessage && <p className="room-status-message">{roomMessage}</p>}
                  <div className="players-table glass-panel">
                    <div className="players-table-header">
                      <span><UsersRound size={16} /> Players</span>
                      <span>{players.length} joined</span>
                    </div>
                    {players.map((player) => (
                      <div className={`player-row ${player.id === playerId ? "player-row-own" : ""}`} key={player.id}>
                        {player.id === playerId && editing ? (
                          <input
                            autoFocus
                            value={username}
                            maxLength={24}
                            onChange={(event) => setUsername(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") renamePlayer();
                            }}
                            onBlur={renamePlayer}
                            className="username-input"
                          />
                        ) : player.id === playerId ? (
                          <button onClick={() => setEditing(true)} className="username-button">
                            {player.username}
                            <Pencil size={15} />
                          </button>
                        ) : (
                          <span>{player.username}</span>
                        )}
                        {player.id === playerId && <span className="you-label">You</span>}
                        {player.isHost && <span className="host-label">Host</span>}
                        {!player.isHost && (
                          <span className={`ready-label ${player.ready ? "ready-label-active" : ""}`}>
                            {player.ready ? "Ready" : "Not ready"}
                          </span>
                        )}
                      </div>
                    ))}
                    {players.length === 0 && <p className="players-empty">Connecting to room...</p>}
                  </div>
                </div>
              )}
            </>
          )}

          {status !== "waiting" && (
            <>
              <div className="game-topbar">
                <div className={`game-timer ${timeLeft <= 5 && !selectedSide ? "timer-warning" : ""}`}>
                  <Clock3 size={18} />
                  <span>{status === "finished" ? "Done" : `${timeLeft}s`}</span>
                </div>
                <div className="game-round">Round {round} / 10</div>
                <div className="game-score">
                  <Trophy size={18} />
                  <span>{ownRanking?.score || 0} pts</span>
                </div>
              </div>

              {status !== "finished" && question && (
                <>
                  <div className="game-heading">
                    <span className="game-eyebrow">Live multiplayer round</span>
                    <h2>Which statement is true?</h2>
                    <p>Everyone answers the same question. Scores update live.</p>
                  </div>
                  <div className="statement-grid">
                    {(["left", "right"] as const).map((side) => {
                      const statement = side === "left" ? question.leftStatement : question.rightStatement;
                      const isSelected = selectedSide === side;
                      const result = status === "results";
                      const resultClass = !result
                        ? ""
                        : question.correctSide === side
                          ? "statement-correct"
                          : isSelected
                            ? "statement-wrong"
                            : "statement-muted";

                      return (
                        <button
                          key={side}
                          className={`statement-card glass-panel ${isSelected ? "statement-selected" : ""} ${resultClass}`}
                          onClick={() => submitAnswer(side)}
                          disabled={status !== "playing" || selectedSide !== null || timeLeft === 0}
                        >
                          <span className="statement-label">{side === "left" ? "A" : "B"}</span>
                          <span className="statement-text">{statement}</span>
                          {result && (
                            <span className="statement-result">
                              {question.correctSide === side ? "True statement" : isSelected ? "Not quite" : ""}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {status === "results" && (
                    <div className={`game-feedback ${answeredCorrectly ? "feedback-correct" : "feedback-wrong"}`}>
                      <strong>
                        {selectedSide === "timeout"
                          ? "Time's up!"
                          : answeredCorrectly
                            ? `Correct! +${roundAnswers[playerId || ""]?.points || 0} points`
                            : "Not this time."}
                      </strong>
                      <span>{question.explanation}</span>
                      <p className="ranking-waiting">Next round is starting for everyone...</p>
                    </div>
                  )}
                  {(status === "playing" || status === "results") && (
                    <div className="live-ranking glass-panel">
                      <strong>Live ranking</strong>
                      {status === "playing" && (
                        <p className="ranking-waiting">Ranking updates after everyone answers.</p>
                      )}
                      {rankings.map((ranking, index) => (
                        <div className="ranking-row" key={ranking.id}>
                          <span>#{index + 1} {ranking.username}</span>
                          <strong>{ranking.score}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {status === "finished" && (
                <FinalStandings rankings={rankings} playerId={playerId} onExit={() => router.push("/")} />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function FinalStandings({
  rankings,
  playerId,
  onExit,
}: {
  rankings: Ranking[];
  playerId: string | null;
  onExit: () => void;
}) {
  return (
    <div className="final-standings">
      <div className="game-heading">
        <Trophy size={38} className="final-trophy" />
        <span className="game-eyebrow">Game complete</span>
        <h2>Final standings</h2>
        <p>{rankings.find((ranking) => ranking.id === playerId)?.score || 0} points earned</p>
      </div>
      <div className="podium">
        {[1, 0, 2].map((rankingIndex) => {
          const ranking = rankings[rankingIndex];
          if (!ranking) return null;
          return (
            <div className={`podium-place podium-place-${rankingIndex + 1}`} key={ranking.id}>
              <span className="podium-medal">{rankingIndex + 1}</span>
              <strong>{ranking.username}</strong>
              <span>{ranking.score} pts</span>
            </div>
          );
        })}
      </div>
      {rankings.length > 3 && (
        <div className="final-ranking-list glass-panel">
          {rankings.slice(3).map((ranking, index) => (
            <div className="ranking-row" key={ranking.id}>
              <span>#{index + 4} {ranking.username}</span>
              <strong>{ranking.score}</strong>
            </div>
          ))}
        </div>
      )}
      <button onClick={onExit} className="btn-game-primary">Back to home</button>
    </div>
  );
}
