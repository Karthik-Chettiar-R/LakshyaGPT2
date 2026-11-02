"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Compass,
  HelpCircle,
  Lightbulb,
  CornerDownLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Gamepad2,
  Clock3,
  Trophy,
  ArrowLeft,
  RotateCcw,
  UserRound,
  UsersRound
} from "lucide-react";
import confetti from "canvas-confetti";

// Define the interface for chat messages
interface AIMessage {
  id: string;
  role: "assistant";
  query: string;
  answer: string;
  justification: string;
  trueAnswer: string;
  isTruth: boolean;
  revealed: boolean;
  scanning: boolean;
  typingCompleted: boolean;
}

interface UserMessage {
  id: string;
  role: "user";
  content: string;
}

type Message = UserMessage | AIMessage;

function LakshyaGPTPageContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState(false);
  const [gameSelection, setGameSelection] = useState<"menu" | "single">("menu");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat area to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Adjust input textarea height on change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // Pre-configured suggestive questions
  const suggestions = [
    {
      title: "Capital of Australia",
      query: "What is the capital of Australia?",
      icon: Compass,
      desc: "An old geographic debate...",
    },
    {
      title: "Lightbulb Discovery",
      query: "Who invented the lightbulb?",
      icon: Lightbulb,
      desc: "Edison, Tesla, or Joseph Swan?",
    },
    {
      title: "Pyramid Concentration",
      query: "Which country has the most ancient pyramids in the world?",
      icon: Brain,
      desc: "Is it Egypt, or somewhere else?",
    },
    {
      title: "Light to Earth",
      query: "How long does it take for light from the Sun to reach Earth?",
      icon: HelpCircle,
      desc: "A brief cosmic journey.",
    }
  ];

  // Submit search query
  const handleSubmit = async (queryText?: string) => {
    const activeQuery = queryText || input;
    if (!activeQuery.trim() || loading) return;

    // Reset UI state
    setInput("");
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMessageId = `user-${Date.now()}`;
    const userMsg: UserMessage = {
      id: userMessageId,
      role: "user",
      content: activeQuery
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.role === "user" ? m.content : m.answer
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from LakshyaGPT server.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessageId = `ai-${Date.now()}`;
      const aiMsg: AIMessage = {
        id: aiMessageId,
        role: "assistant",
        query: activeQuery,
        answer: data.answer,
        justification: data.justification,
        trueAnswer: data.trueAnswer,
        isTruth: data.isTruth,
        revealed: false,
        scanning: false,
        typingCompleted: false
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please check your API key setup.");
    } finally {
      setLoading(false);
    }
  };

  // Keypress support inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Run fact checking scanning sequence
  const handleFactCheck = (messageId: string, isTruth: boolean) => {
    // 1. Set scanning state to true
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, scanning: true } : m)
    );

    // 2. Play 1.5s scanning effect
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, scanning: false, revealed: true } : m)
      );

      // 3. Trigger confetti if it was a Truth!
      if (isTruth) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.75 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6"]
        });
      }
    }, 1500);
  };

  // Update specific message typing state when typing completes
  const handleTypingComplete = (messageId: string) => {
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, typingCompleted: true } : m)
    );
  };

  // Reset the single chat conversation
  const handleResetChat = () => {
    setMessages([]);
    setError(null);
    setInput("");
  };

  const launchedFromRoom = searchParams.get("game") === "single";

  if (gameMode || launchedFromRoom) {
    if (!launchedFromRoom && gameSelection === "menu") {
      return (
        <GameModeSelection
          onSinglePlayer={() => setGameSelection("single")}
          onExit={() => setGameMode(false)}
        />
      );
    }

    return <GameMode onExit={() => setGameMode(false)} />;
  }

  return (
    <main className="app-canvas">
      {/* Background Orbs */}
      <div className="bg-glow-orb top-right" />
      <div className="bg-glow-orb bottom-left" />

      {/* Header bar */}
      <header className="header-bar">
        <button onClick={() => {
          setGameMode(true);
          setGameSelection("menu");
        }} className="btn-game-mode">
          <Gamepad2 style={{ width: "15px", height: "15px" }} />
          Game Mode
        </button>

        <div className="header-brand">
          <div className="brand-icon-box">
            <Brain style={{ width: "20px", height: "20px", color: "#fff" }} />
          </div>
          <div>
            <h1 className="brand-title">LakshyaGPT</h1>

          </div>
        </div>

        <div className="header-actions">
          {messages.length > 0 && (
            <button onClick={handleResetChat} className="btn-reset">
              <RefreshCw style={{ width: "14px", height: "14px" }} />
              New Chat
            </button>
          )}
        </div>
      </header>

      {/* Primary chat canvas */}
      <section className="chat-scroll-area">
        <div className="chat-max-width-wrapper">
          {messages.length === 0 ? (
            /* Dashboard Greeting / Suggestion Area */
            <div className="dashboard-greeting">
              <div className="greeting-card animate-float">
                <h2 className="greeting-title">I'm LakshyaGPT.</h2>
                <p className="greeting-desc">
                  I speak with absolute authority, absolute confidence, and absolute eloquence. I tell the absolute truth 
                </p>

              </div>

              {/* Suggestions Grid */}
              <div className="suggestions-grid">
                {suggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSubmit(item.query)}
                    className="suggestion-card glass-panel glass-panel-hover"
                  >
                    <div className="suggestion-arrow">
                      <ChevronRight style={{ width: "16px", height: "16px" }} />
                    </div>
                    <div className="suggestion-icon-box">
                      <item.icon style={{ width: "16px", height: "16px" }} />
                    </div>
                    <h3 className="suggestion-title">{item.title}</h3>
                    <p className="suggestion-desc">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat message thread */
            <div className="chat-thread-container">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-wrapper ${msg.role} animate-fade-in`}
                >
                  {msg.role === "user" ? (
                    /* User Question Bubble */
                    <div className="user-bubble">
                      {msg.content}
                    </div>
                  ) : (
                    /* LakshyaGPT Response Card */
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {/* AI Avatar Label */}
                      <div className="ai-avatar-row">
                        <div className="ai-avatar-icon">
                          <Brain style={{ width: "12px", height: "12px" }} />
                        </div>
                        <span className="ai-avatar-name">LakshyaGPT</span>
                      </div>

                      {/* Main Card */}
                      <div
                        className={`ai-response-card glass-panel ${msg.scanning ? "scanning" : ""
                          } ${msg.revealed && !msg.isTruth ? "deception-revealed animate-shake" : ""
                          } ${msg.revealed && msg.isTruth ? "truth-revealed" : ""
                          }`}
                      >
                        {/* Interactive holographic scanner bar */}
                        {msg.scanning && <div className="scanner-bar" />}

                        {/* AI Eloquent Statement */}
                        <div className="ai-card-content">
                          <h3 className="ai-answer-title">
                            {msg.typingCompleted ? (
                              msg.answer
                            ) : (
                              <TypewriterText
                                text={msg.answer}
                                speed={18}
                                onComplete={() => { }}
                              />
                            )}
                          </h3>

                          <div className="ai-card-divider" />

                          <p className="ai-justification-text">
                            {msg.typingCompleted ? (
                              msg.justification
                            ) : (
                              <TypewriterText
                                text={msg.justification}
                                speed={12}
                                delay={msg.answer.length * 18 + 150}
                                onComplete={() => handleTypingComplete(msg.id)}
                                isParagraph={true}
                              />
                            )}
                          </p>
                        </div>

                        {/* Interactive Fact-Check / Reveal States */}

                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                /* Sleek loading state card mimicking Gemini loading style */
                <div className="loader-card-pulsing">
                  <div className="loader-avatar-row">
                    <div className="loader-avatar-dot" />
                    <span className="loader-text-label">LakshyaGPT is thinking...</span>
                  </div>
                  <div className="loader-card glass-panel">
                    <div className="loader-shimmer-title" />
                    <div className="ai-card-divider" />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div className="loader-shimmer-body-1" />
                      <div className="loader-shimmer-body-2" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-block animate-fade-in">
                  <AlertTriangle style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                  <div>
                    <h4 className="error-title">Configuration Required</h4>
                    <p className="error-desc" style={{ marginBottom: "0.5rem" }}>
                      To talk with LakshyaGPT, you need to configure your Gemini API Key in the `.env.local` file at the root of the project:
                    </p>
                    <code className="error-code-block">
                      GEMINI_API_KEY=YOUR_KEY_HERE
                    </code>
                    <p className="error-desc">
                      Get a free API key from Google AI Studio and update the file, then restart the local Next.js dev server.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Floating text input container at bottom */}
      <footer className="input-footer">
        <div className="input-max-width-wrapper">
          {/* Main Input Form */}
          <div className="input-bar-container glass-panel">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask LakshyaGPT anything..."
              disabled={loading}
              className="textarea-input"
            />
            <button
              disabled={!input.trim() || loading}
              onClick={() => handleSubmit()}
              className="btn-send"
            >
              <Send style={{ width: "16px", height: "16px" }} />
            </button>
          </div>

          {/* Quick instructions / Status bar */}
          <div className="input-meta-row">
            <span className="meta-model">
              <span className="meta-model-dot" />
              Model: LakshyaGPT
            </span>
            <span className="meta-shortcut">
              Press Enter <CornerDownLeft style={{ width: "12px", height: "12px", display: "inline" }} /> to ask
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function LakshyaGPTPage() {
  return (
    <Suspense fallback={null}>
      <LakshyaGPTPageContent />
    </Suspense>
  );
}

interface GameModeSelectionProps {
  onSinglePlayer: () => void;
  onExit: () => void;
}

function GameModeSelection({ onSinglePlayer, onExit }: GameModeSelectionProps) {
  const router = useRouter();

  return (
    <main className="app-canvas game-canvas">
      <div className="bg-glow-orb top-right" />
      <div className="bg-glow-orb bottom-left" />

      <header className="header-bar">
        <div className="header-brand">
          <div className="brand-icon-box">
            <Gamepad2 style={{ width: "20px", height: "20px", color: "#fff" }} />
          </div>
          <h1 className="brand-title">Game Mode</h1>
        </div>
        <button onClick={onExit} className="btn-reset">
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          Back to Chat
        </button>
      </header>

      <section className="game-scroll-area">
        <div className="game-wrapper game-selection-wrapper">
          <div className="game-heading">
            <span className="game-eyebrow">Choose your challenge</span>
            <h2>How do you want to play?</h2>
            <p>Pick a mode and see if you can spot the truth.</p>
          </div>

          <div className="mode-selection-grid">
            <button onClick={onSinglePlayer} className="mode-selection-card mode-single-player">
              <span className="mode-icon">
                <UserRound style={{ width: "34px", height: "34px" }} />
              </span>
              <strong>Single Player</strong>
              <span>Play solo against the clock.</span>
            </button>
            <button
              onClick={() => router.push("/multiplayer")}
              className="mode-selection-card mode-multiplayer"
            >
              <span className="mode-icon">
                <UsersRound style={{ width: "34px", height: "34px" }} />
              </span>
              <strong>Multiplayer</strong>
              <span>Challenge friends in a room.</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

interface GameQuestion {
  leftStatement: string;
  rightStatement: string;
  correctSide: "left" | "right";
  explanation: string;
}

interface GameModeProps {
  onExit: () => void;
}

type SelectedSide = "left" | "right" | "timeout" | null;

function GameMode({ onExit }: GameModeProps) {
  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [selectedSide, setSelectedSide] = useState<SelectedSide>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const loadQuestion = async () => {
    setLoading(true);
    setError(null);
    setQuestion(null);
    setSelectedSide(null);

    try {
      const response = await fetch("/api/game", { method: "POST" });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate a game question.");
      }
      setQuestion(data);
      setTimeLeft(30);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestion();
  }, []);

  useEffect(() => {
    if (!question || selectedSide !== null || gameOver) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [question, selectedSide, gameOver]);

  useEffect(() => {
    if (timeLeft === 0 && question && selectedSide === null) {
      setSelectedSide("timeout");
    }
  }, [timeLeft, question, selectedSide]);

  const handleSelection = (side: "left" | "right") => {
    if (!question || selectedSide !== null) return;

    setSelectedSide(side);
    if (side === question.correctSide) {
      const points = Math.max(1, Math.ceil((timeLeft / 30) * 10));
      setScore((current) => Math.min(100, current + points));
    }
  };

  const handleNextRound = () => {
    if (round >= 10) {
      setGameOver(true);
      return;
    }

    setRound((current) => current + 1);
    void loadQuestion();
  };

  const handleRestart = () => {
    setQuestion(null);
    setScore(0);
    setRound(1);
    setGameOver(false);
    void loadQuestion();
  };

  const answeredCorrectly =
    question !== null &&
    selectedSide !== null &&
    selectedSide !== "timeout" &&
    selectedSide === question.correctSide;

  return (
    <main className="app-canvas game-canvas">
      <div className="bg-glow-orb top-right" />
      <div className="bg-glow-orb bottom-left" />

      <header className="header-bar">
        <div className="header-brand">
          <div className="brand-icon-box">
            <Gamepad2 style={{ width: "20px", height: "20px", color: "#fff" }} />
          </div>
          <div>
            <h1 className="brand-title">Game Mode</h1>
          </div>
        </div>
        <button onClick={onExit} className="btn-reset">
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          Back to Chat
        </button>
      </header>

      <section className="game-scroll-area">
        <div className="game-wrapper">
          <div className="game-topbar">
            <div className={`game-timer ${timeLeft <= 5 && !selectedSide ? "timer-warning" : ""}`}>
              <Clock3 style={{ width: "18px", height: "18px" }} />
              <span>{timeLeft}s</span>
            </div>
            <div className="game-round">Round {round} / 10</div>
            <div className="game-score">
              <Trophy style={{ width: "18px", height: "18px" }} />
              <span>{score} / 100</span>
            </div>
          </div>

          <div className="game-heading">
            <span className="game-eyebrow">Test your instincts</span>
            <h2>Which statement is true?</h2>
            <p>One is a fact. One is a convincing fake. Choose before the clock runs out.</p>
          </div>

          {loading && (
            <div className="game-loading glass-panel">
              <div className="loader-avatar-dot" />
              <span>Gemini is preparing two statements...</span>
            </div>
          )}

          {error && (
            <div className="game-error glass-panel">
              <p>{error}</p>
              <button onClick={() => void loadQuestion()} className="btn-game-primary">
                Try again
              </button>
            </div>
          )}

          {!loading && question && !gameOver && (
            <>
              <div className="statement-grid">
                {(["left", "right"] as const).map((side) => {
                  const statement = side === "left" ? question.leftStatement : question.rightStatement;
                  const isSelected = selectedSide === side;
                  const isCorrect = question.correctSide === side;
                  const resultClass =
                    selectedSide === null
                      ? ""
                      : isCorrect
                        ? "statement-correct"
                        : isSelected
                          ? "statement-wrong"
                          : "statement-muted";

                  return (
                    <button
                      key={side}
                      className={`statement-card glass-panel ${isSelected ? "statement-selected" : ""} ${resultClass}`}
                      onClick={() => handleSelection(side)}
                      disabled={selectedSide !== null}
                    >
                      <span className="statement-label">{side === "left" ? "A" : "B"}</span>
                      <span className="statement-text">{statement}</span>
                      {selectedSide !== null && (
                        <span className="statement-result">
                          {isCorrect ? "True statement" : isSelected ? "Not quite" : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedSide !== null && (
                <div className={`game-feedback ${answeredCorrectly ? "feedback-correct" : "feedback-wrong"}`}>
                  <strong>
                    {selectedSide === "timeout"
                      ? "Time's up!"
                      : answeredCorrectly
                        ? `Correct! +${Math.max(1, Math.ceil((timeLeft / 30) * 10))}/10 points`
                        : "Not this time."}
                  </strong>
                  <span>{question.explanation}</span>
                  <button onClick={handleNextRound} className="btn-game-primary">
                    {round >= 10 ? "See final score" : "Next statement"}
                  </button>
                </div>
              )}
            </>
          )}

          {gameOver && (
            <div className="game-over-card glass-panel">
              <Trophy style={{ width: "38px", height: "38px" }} />
              <span className="game-eyebrow">Game complete</span>
              <h2>You scored {score} / 100</h2>
              <p>{score >= 70 ? "Sharp eye. You spotted the truth." : "The fakes were convincing. Try another round."}</p>
              <button onClick={handleRestart} className="btn-game-primary">
                <RotateCcw style={{ width: "15px", height: "15px" }} />
                Play again
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* Custom Subcomponent for smooth real-time typing effect */
interface TypewriterProps {
  text: string;
  speed: number;
  delay?: number;
  onComplete: () => void;
  isParagraph?: boolean;
}

function TypewriterText({ text, speed, delay = 0, onComplete, isParagraph = false }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Handle initial delay
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < text.length) {
        setDisplayedText(text.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed, onComplete]);

  return (
    <span className={!done && started ? "typing-cursor" : ""}>
      {displayedText}
    </span>
  );
}
