"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Gamepad2, Plus, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPlayerId } from "@/lib/player-id";

function createRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function MultiplayerPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    getPlayerId();
  }, []);

  const handleCreateRoom = () => {
    router.push(`/multiplayer/${createRoomCode()}`);
  };

  const handleJoinRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const roomCode = joinCode.trim();

    if (!/^\d{6}$/.test(roomCode)) {
      setJoinError("Enter a valid six-digit room code.");
      return;
    }

    setJoinError("");
    router.push(`/multiplayer/${roomCode}`);
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
          <h1 className="brand-title">Multiplayer</h1>
        </div>
        <button onClick={() => router.push("/")} className="btn-reset">
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          Back to Chat
        </button>
      </header>

      <section className="game-scroll-area">
        <div className="game-wrapper game-selection-wrapper">
          <div className="game-heading">
            <span className="game-eyebrow">Play together</span>
            <h2>Join the challenge</h2>
            <p>Create a room for your friends or join a room with an invite code.</p>
          </div>

          <div className="room-selection-grid">
            <button className="room-action-card glass-panel" type="button" onClick={handleCreateRoom}>
              <span className="room-action-icon room-create-icon">
                <Plus style={{ width: "30px", height: "30px" }} />
              </span>
              <strong>Create a room</strong>
              <span>Start a new game and invite your friends.</span>
            </button>
            <form className="room-action-card glass-panel room-join-form" onSubmit={handleJoinRoom}>
              <span className="room-action-icon room-join-icon">
                <LogIn style={{ width: "28px", height: "28px" }} />
              </span>
              <strong>Join a room</strong>
              <span>Enter a room code to play with others.</span>
              <input
                className="room-code-input"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                aria-label="Six-digit room code"
                value={joinCode}
                onChange={(event) => {
                  setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setJoinError("");
                }}
              />
              <button className="btn-game-primary room-join-button" type="submit">
                Join room
              </button>
              {joinError && <span className="room-join-error">{joinError}</span>}
            </form>
          </div>

          <button onClick={() => router.push("/")} className="multiplayer-back-link">
            <ArrowLeft style={{ width: "14px", height: "14px" }} />
            Return to home
          </button>
        </div>
      </section>
    </main>
  );
}
