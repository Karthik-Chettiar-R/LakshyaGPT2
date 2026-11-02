# 🎯 LakshyaGPT - Complete Interview Preparation Guide

> Comprehensive breakdown for TCS Prime Interview
> Last Updated: August 6, 2026

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Deep Dive](#2-tech-stack-deep-dive)
3. [Architecture & Data Flow](#3-architecture--data-flow)
4. [Code Breakdown by File](#4-code-breakdown-by-file)
5. [Interview Questions & Answers](#5-interview-questions--answers)
   - [Beginner Level](#beginner-level-3-questions)
   - [Intermediate Level](#intermediate-level-3-questions)
   - [Advanced Level](#advanced-level-3-questions)
   - [Tech-Stack Specific](#tech-stack-specific-2-questions)
6. [Key Concepts to Know](#6-key-concepts-to-know)
7. [Potential Questions & How to Answer](#7-potential-questions--how-to-answer)
8. [Project Limitations & Improvements](#8-project-limitations--improvements)
9. [Quick Reference](#9-quick-reference)

---

## 1. Project Overview

### What is LakshyaGPT?

**LakshyaGPT** is a ChatGPT-style AI chatbot with a twist - it deliberately provides **confidently incorrect but highly plausible answers**. The user can then click a "fact-check" button to reveal the deception. It's designed to be humorous while demonstrating real-world AI integration skills.

### The Core Concept

- **User asks a question** (e.g., "What is the capital of Australia?")
- **LakshyaGPT responds** with a false but believable answer (e.g., "Sydney") with a convincing justification
- **User clicks "Fact Check"** → reveals it's a lie with a shaking animation
- **If ever telling truth** → confetti celebration

This project demonstrates:
- Full-stack web development
- AI/LLM integration
- Modern UI/UX design
- API development
- State management

---

## 2. Tech Stack Deep Dive

### Complete Technology Breakdown

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 16.2.6 | React framework with App Router |
| **Language** | TypeScript | ^5 | Type-safe JavaScript |
| **UI Library** | React | 19.2.4 | Frontend component library |
| **AI SDK** | Vercel AI SDK (ai) | ^6.0.193 | Unified AI provider interface |
| **Model** | Google Gemini | gemini-2.5-flash | LLM for generating responses |
| **Schema** | Zod | ^3 | Schema validation & type inference |
| **Styling** | CSS Modules + CSS Variables | - | Custom design system |
| **Icons** | Lucide React | ^1.17.0 | Lightweight SVG icons |
| **Animations** | Canvas Confetti | ^1.9.4 | Celebration effects |
| **Fonts** | Google Fonts | - | Plus Jakarta Sans, Space Grotesk |

### Why These Technologies?

**Next.js 16.2.6 (App Router)**
- Server-side rendering (SSR) for initial page load
- API routes built-in (no separate Express server needed)
- File-based routing
- Automatic code splitting

**Vercel AI SDK (ai)**
- Provider-agnostic - swap between OpenAI, Google, Anthropic easily
- Built-in streaming support
- Structured output generation
- Token usage tracking

**Google Gemini**
- Generous free tier via Google AI Studio
- Strong JSON structured output
- Fast response times (Flash model)
- Good reasoning capabilities

**Zod**
- TypeScript-first schema validation
- Infers types from schemas
- Used here to force LLM to return exact JSON structure

---

## 3. Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                    │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ User Input   │───▶│ React State  │───▶│ Typewriter Display   │  │
│  │ (Textarea)  │    │ (messages[]) │    │ (Character by char)  │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                    │                                       │
│         │                    ▼                                       │
│         │            ┌──────────────┐                                │
│         └───────────▶│ POST /api   │                                │
│                      │ /chat        │                                │
└───────────────────────▶│              │◀─────────────────────────────┘
                       └──────┬───────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS SERVER                               │
│                                                                      │
│   ┌─────────────┐    ┌──────────────┐    ┌───────────────────────┐ │
│   │ Validation  │───▶│ AI SDK Call  │───▶│ Zod Schema Validation │ │
│   │ (Input)    │    │ (Gemini)     │    │ (Output)              │ │
│   └─────────────┘    └──────────────┘    └───────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL APIS                                   │
│                                                                      │
│   ┌─────────────────────┐    ┌─────────────────────────────────┐   │
│   │ Google Gemini API   │    │ Google Fonts                    │   │
│   │ (AI Generation)    │    │ (Plus Jakarta Sans, Space       │   │
│   │                     │    │  Grotesk)                       │   │
│   └─────────────────────┘    └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Step-by-Step

1. **User Input**
   - User types in textarea
   - Presses Enter or clicks Send button
   - `handleSubmit()` is called

2. **Client-Side Processing** (page.tsx)
   - User message added to React state immediately
   - Loading state set to true
   - POST request prepared with messages array

3. **API Request** (route.ts)
   - Request received at `/api/chat`
   - Input validated (non-empty check)
   - System prompt + user query prepared
   - Zod schema prepared for response

4. **AI Processing**
   - Vercel AI SDK calls Gemini with:
     - Model: `gemini-2.5-flash`
     - System prompt (instructions to lie confidently)
     - User question
     - Response schema

5. **Response Handling**
   - AI returns structured object
   - Server sends JSON back to client
   - Client parses and displays with typewriter effect

6. **Display**
   - Typewriter effect animates character by character
   - Justification appears after answer completes
   - Fact-check button available for user

---

## 4. Code Breakdown by File

### 4.1 src/app/api/chat/route.ts (Complete Analysis)

```typescript
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
```

**Explanation:**
- `dynamic = 'force-dynamic'` tells Next.js not to cache this route - every request should hit the server
- This ensures each chat message gets a fresh AI response

```typescript
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || "";

    if (!userQuery.trim()) {
      return Response.json({ error: "Empty query provided" }, { status: 400 });
    }
```

**Explanation:**
- Extracts messages from request body
- Gets the most recent message (user's current question)
- Basic input validation - rejects empty queries with 400 status

```typescript
    // 2. Define the schema to force exact structure (Answer and Justification only)
    const responseSchema = z.object({
      answer: z.string().describe("The answer must be a complete lie which is highly plausible and believable"),
      justification: z.string().describe("A highly convincing 2 to 3 line explanation justifying the answer. Written in a professional, authoritative chatbot tone. Keep it strictly to 2 or 3 lines."),
    });
```

**Explanation:**
- Zod schema defines the EXACT structure the AI must return
- The `describe()` method provides instructions to the AI model about what each field should contain
- Forces AI to return only `answer` and `justification` fields

```typescript
    // 3. Formulate the system instruction for generating a highly convincing lie
    const systemPrompt = `You are LakshyaGPT, a confidently incorrect AI chatbot.
You must deliberately provide a false but highly plausible answer to the user's question (e.g. Sydney instead of Canberra for Australia's capital, Nikola Tesla or Thomas Edison depending on discovery details).
- The answer must feel very true. Any person not knowledgeable about it will easily believe it.
- Set this highly convincing lie in the "answer" field.
- Set a highly convincing, 2 to 3 line justification explaining your false answer in the "justification" field. Use plausible historical myths, pseudo-facts, or convincing explanations to make it believable.`;
```

**Explanation:**
- System prompt defines the AI's "persona" and behavior
- Explicitly tells the AI to lie confidently
- Provides examples (Sydney vs Canberra)
- Instructions on tone (authoritative, professional)

```typescript
    // 4. Request the structured response from Gemini (using valid gemini-1.5-flash model)
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: responseSchema,
      system: systemPrompt,
      prompt: `User question: "${userQuery}"`
    });
```

**Explanation:**
- `generateObject()` is from Vercel AI SDK
- `google('gemini-2.5-flash')` specifies the model
- `schema: responseSchema` enforces the Zod schema
- `system` is the system prompt (persona)
- `prompt` is the actual user question

```typescript
    // 5. Send back the fields with isTruth always false for client-side compatibility
    return Response.json({
      ...result.object,
      isTruth: false,
      trueAnswer: ""
    });
```

**Explanation:**
- Returns the AI's response (answer + justification)
- Always sets `isTruth: false` (since it's supposed to lie)
- Empty `trueAnswer` - could be enhanced to provide real answer

```typescript
  } catch (error: any) {
    console.error("Error in LakshyaGPT /api/chat handler:", error);
    return Response.json({
      error: error.message || "Internal server error"
    }, {
      status: 500
    });
  }
}
```

**Explanation:**
- Catches any errors during processing
- Logs error to server console for debugging
- Returns 500 status with error message

---

### 4.2 src/app/page.tsx (Complete Analysis)

#### Imports Section

```typescript
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Send, RefreshCw, AlertTriangle, CheckCircle2,
  Brain, Compass, HelpCircle, Lightbulb, CornerDownLeft,
  ChevronRight, ShieldCheck, ShieldAlert
} from "lucide-react";
import confetti from "canvas-confetti";
```

**Explanation:**
- `"use client"` - Required because this component uses React hooks (useState, useEffect)
- Lucide React - Collection of clean SVG icons
- canvas-confetti - For celebration animation when truth is revealed

#### Type Definitions

```typescript
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
```

**Explanation:**
- TypeScript interfaces for type safety
- Union type `Message` can be either user or AI message
- `AIMessage` has extra fields for UI state (scanning, revealed, typingCompleted)

#### Main Component State

```typescript
export default function LakshyaGPTPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
```

**Explanation:**
- `messages` - Array of all chat messages
- `input` - Current user input
- `loading` - Is AI processing?
- `error` - Any error message to display
- `messagesEndRef` - For auto-scrolling to bottom
- `textareaRef` - For auto-resizing textarea

#### Auto-Scroll Effect

```typescript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, loading]);
```

**Explanation:**
- Automatically scrolls to bottom when messages change or loading starts
- Uses `smooth` behavior for nice animation

#### Input Auto-Resize

```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setInput(e.target.value);
  if (textareaRef.current) {
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }
};
```

**Explanation:**
- Grows textarea as user types
- Caps at 160px max height
- Resets height to "auto" first to shrink if user deletes text

#### Pre-configured Suggestions

```typescript
const suggestions = [
  {
    title: "Capital of Australia",
    query: "What is the capital of Australia?",
    icon: Compass,
    desc: "An old geographic debate...",
  },
  // ... more suggestions
];
```

**Explanation:**
- Quick-start questions for users to click
- Shows different icon for each
- Provides teaser descriptions

#### Submit Handler (Core Logic)

```typescript
const handleSubmit = async (queryText?: string) => {
  const activeQuery = queryText || input;
  if (!activeQuery.trim() || loading) return;

  setInput("");
  setError(null);

  const userMessageId = `user-${Date.now()}`;
  const userMsg: UserMessage = {
    id: userMessageId,
    role: "user",
    content: activeQuery
  };

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
```

**Key Points:**
1. Checks for empty input or if already loading
2. Clears input and error state
3. Creates user message with timestamp ID
4. Calls `/api/chat` endpoint
5. Maps messages to include both user and AI messages
6. Parses response and creates AI message
7. Updates state with new messages
8. Error handling with user-friendly messages

#### Fact-Check Animation

```typescript
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
```

**Explanation:**
1. First updates state to show "scanning" animation
2. After 1.5 seconds, reveals the truth
3. If it was actually true, triggers confetti celebration

#### TypewriterText Component

```typescript
function TypewriterText({ text, speed, delay = 0, onComplete, isParagraph = false }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
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
```

**How it works:**
1. First useEffect handles the initial delay (so justification starts after answer)
2. Second useEffect runs the actual typing animation
3. Uses setInterval to add one character every X milliseconds
4. When complete, calls `onComplete()` to notify parent
5. CSS adds blinking cursor via `.typing-cursor::after`

---

### 4.3 src/app/globals.css (Design System)

#### CSS Variables (Design Tokens)

```css
:root {
  --bg-primary: #07050d;
  --bg-secondary: #12101b;
  --bg-tertiary: #191626;
  --border-color: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(139, 92, 246, 0.4);
  
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-muted: #6b6a77;
  
  --accent-purple: #8b5cf6;
  --accent-blue: #3b82f6;
  --accent-pink: #ec4899;
  
  --accent-green: #10b981;
  --accent-red: #ef4444;
  
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --font-display: 'Space Grotesk', sans-serif;
}
```

**Why CSS Variables?**
- Single source of truth for colors
- Easy to implement dark/light themes
- Consistent design throughout
- Easy to tweak globally

#### Glassmorphism

```css
.glass-panel {
  background: rgba(18, 16, 27, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

**Glassmorphism Effect:**
- Semi-transparent background
- Blur behind the element (frosted glass effect)
- Subtle border for definition
- Soft shadow for depth

#### Keyframe Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
```

---

### 4.4 src/app/layout.tsx

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LakshyaGPT",
  description: "A powerful chatbot answering all your queries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**Explanation:**
- Root layout wraps all pages
- Loads Google Fonts via Next.js font optimization
- Sets page metadata (title, description)
- Applies CSS font variables globally

---

## 5. Interview Questions & Answers

### Beginner Level (3 Questions)

#### Q1: Explain the project structure of this Next.js application.

**Answer:**

This is a **Next.js 16 App Router** project with the following directory structure:

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # API endpoint for chat
│   ├── globals.css            # Global styles & design system
│   ├── layout.tsx            # Root layout with fonts
│   ├── page.module.css       # Page-specific styles (unused here)
│   └── page.tsx              # Main chat UI (client component)
├── .env.local                # Environment variables (API key)
├── package.json              # Dependencies
├── next.config.ts            # Next.js configuration
└── tsconfig.json             # TypeScript configuration
```

Key points about the structure:
- **App Router** (not Pages Router) - indicated by `src/app/` directory
- **API Routes** - files inside `src/app/api/` become API endpoints automatically
- **route.ts** naming convention - `src/app/api/chat/route.ts` handles `/api/chat`
- **Client vs Server Components** - `page.tsx` has `"use client"` directive

---

#### Q2: How does the chat message flow work?

**Answer:**

The chat flow follows this sequence:

1. **User Input**: User types in textarea and presses Enter or clicks Send
2. **Client Processing**: 
   - `handleSubmit()` is called
   - User message immediately added to React state (optimistic update)
   - Loading state set to true
3. **API Request**:
   - Client sends POST to `/api/chat` with messages array
   - Request includes `Content-Type: application/json`
4. **Server Processing**:
   - Extracts user query from request body
   - Validates input (rejects empty queries)
   - Creates system prompt instructing AI to lie confidently
   - Calls Gemini via Vercel AI SDK with Zod schema
5. **Response**:
   - AI returns structured JSON with `answer` and `justification`
   - Server returns JSON to client
6. **Display**:
   - Typewriter effect animates character-by-character
   - Justification appears after answer completes

The code for the API call is in [route.ts:32-37](src/app/api/chat/route.ts#L32-L37):
```typescript
const result = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: responseSchema,
  system: systemPrompt,
  prompt: `User question: "${userQuery}"`
});
```

---

#### Q3: What is the purpose of Zod in this project?

**Answer:**

**Zod** is used for two purposes:

1. **Schema Definition** - Defines the exact structure the AI must return:
```typescript
const responseSchema = z.object({
  answer: z.string().describe("The answer must be a complete lie..."),
  justification: z.string().describe("A highly convincing 2 to 3 line explanation..."),
});
```

2. **Type Inference** - Zod automatically infers TypeScript types from schemas:
```typescript
// After defining schema, you get:
type ResponseSchema = z.infer<typeof responseSchema>;
// Result: { answer: string; justification: string; }
```

3. **LLM Guidance** - The `describe()` method provides instructions directly to the AI model:
   - "The answer must be a complete lie which is highly plausible and believable"
   - This tells the LLM exactly what to generate in each field

**Why not just parse JSON manually?**
- Zod provides validation and error handling
- Works with `generateObject()` to enforce structure at generation time
- If AI tries to return wrong format, SDK handles it gracefully

---

### Intermediate Level (3 Questions)

#### Q4: How does the TypewriterText component work?

**Answer:**

The TypewriterText component creates a character-by-character typing animation. Here's how it works:

```typescript
function TypewriterText({ text, speed, delay = 0, onComplete, isParagraph = false }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  // First effect: Handle initial delay
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  // Second effect: Typing animation
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
```

**Key aspects:**
- **Two useEffects**: First handles delay, second handles animation
- **setInterval**: Adds one character every X milliseconds (speed)
- **Callback**: `onComplete()` notifies parent when typing finishes
- **CSS Cursor**: `.typing-cursor::after` adds blinking cursor via CSS
- **Delay parameter**: Allows justification to start after answer completes

**Usage in the app:**
- Answer text: speed = 18ms per character
- Justification text: speed = 12ms per character, delay = answer.length * 18 + 150ms

---

#### Q5: How is error handling implemented in the API route?

**Answer:**

The API route has try-catch error handling at [route.ts:45-52](src/app/api/chat/route.ts#L45-L52):

```typescript
} catch (error: any) {
  console.error("Error in LakshyaGPT /api/chat handler:", error);
  return Response.json({
    error: error.message || "Internal server error"
  }, {
    status: 500
  });
}
```

**Error handling includes:**

1. **Input validation** - Checks for empty query:
```typescript
if (!userQuery.trim()) {
  return Response.json({ error: "Empty query provided" }, { status: 400 });
}
```

2. **HTTP status codes**:
   - 400: Bad Request (empty query)
   - 500: Internal Server Error (catch-all for AI failures)

3. **Client-side error handling** - In page.tsx:
```typescript
try {
  const response = await fetch("/api/chat", {...});
  if (!response.ok) {
    throw new Error("Failed to fetch response from LakshyaGPT server.");
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
} catch (err: any) {
  setError(err.message || "Something went wrong. Please check your API key setup.");
}
```

**Improvement opportunity** (if asked):
```typescript
// Better error handling - check error type
} catch (error) {
  const message = error instanceof Error ? error.message : "Internal server error";
  return Response.json({ error: message }, { status: 500 });
}
```

---

#### Q6: What CSS techniques are used for the glassmorphism design?

**Answer:**

The app uses several modern CSS techniques:

**1. CSS Variables (Design Tokens):**
```css
:root {
  --bg-primary: #07050d;
  --accent-purple: #8b5cf6;
  --glass-panel: rgba(18, 16, 27, 0.65);
}
```

**2. Backdrop Filter (Frosted Glass):**
```css
.glass-panel {
  background: rgba(18, 16, 27, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px); /* Safari */
}
```

**3. Gradients:**
```css
--gradient-accent: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 50%, var(--accent-pink) 100%);
```

**4. CSS Keyframe Animations:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
```

**5. Custom Scrollbar:**
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
```

---

### Advanced Level (3 Questions)

#### Q7: What are the scalability bottlenecks in this architecture?

**Answer:**

Several areas could limit scalability:

**1. API Latency & Cost:**
- Every message requires a round-trip to Gemini API
- No caching of responses
- Costs money per API call

**2. No Rate Limiting:**
- API endpoint has no protection against spam/abuse
- Could be exploited to exhaust API quota

**3. Client-Side State Only:**
- Messages stored in React state only
- Lost on page refresh
- No persistence layer

**4. No Streaming:**
- Uses `generateObject()` which waits for complete response
- User sees "thinking..." until full response arrives
- Could use `streamObject()` for better UX

**5. Single Model:**
- Only uses Gemini Flash
- No fallback if API is down

**Potential Improvements:**
- Add Redis/Vercel KV for message persistence
- Implement rate limiting
- Add streaming for better UX
- Consider caching common questions

---

#### Q8: What security considerations should be addressed?

**Answer:**

**1. API Key Protection:**
- Currently uses `.env.local` for Gemini API key
- In production: Use Vercel Environment Variables or secrets manager
- Never commit API keys to git (already in .gitignore)

**2. No Input Sanitization:**
- User input goes directly to AI prompt
- Could add input length limits
- Consider validating against prompt injection

**3. No Authentication:**
- Any client can call `/api/chat`
- Add authentication for production use

**4. CORS:**
- No explicit CORS headers set
- Relies on Next.js default (same-origin)
- If calling from other domains, add CORS headers

**5. Error Messages:**
- Error messages could leak internal details
- In production, log errors internally, show generic message to users

---

#### Q9: How would you modify this app to store chat history persistently?

**Answer:**

Several options, ranked by complexity:

**Option 1: LocalStorage (Simplest)**
```typescript
// Save to localStorage
useEffect(() => {
  localStorage.setItem('chat-messages', JSON.stringify(messages));
}, [messages]);

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('chat-messages');
  if (saved) setMessages(JSON.parse(saved));
}, []);
```
- Pros: No backend, instant
- Cons: Browser-specific, limited storage (5MB), cleared by user

**Option 2: Vercel KV (Redis)**
```typescript
import { kv } from '@vercel/kv';

export async function POST(req: Request) {
  // Save to Redis
  await kv.hset(`chat:${sessionId}`, { messages: JSON.stringify(messages) });
}
```
- Pros: Fast, server-side, persistent
- Cons: Additional service/cost

**Option 3: Database (PostgreSQL/Supabase)**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

await supabase.from('chats').insert({ user_id, messages });
```
- Pros: Most robust, queryable
- Cons: More setup, requires database management

---

### Tech-Stack Specific (2 Questions)

#### Q10: Why use `@ai-sdk/google` over other providers?

**Answer:**

**Why Google Gemini:**
1. **Generous Free Tier** - Via Google AI Studio
2. **Strong Structured Output** - Good at following Zod schemas
3. **Fast Responses** - Flash model is optimized for speed
4. **Good Reasoning** - 2.5 model has strong capabilities

**The SDK provides:**
- Provider-agnostic interface
- Easy to switch between OpenAI, Anthropic, Google, etc.
- Built-in streaming support
- Token counting and usage tracking

**Code showing provider usage:**
```typescript
import { google } from '@ai-sdk/google';

const result = await generateObject({
  model: google('gemini-2.5-flash'),
  // ... rest of config
});
```

**Other available models in the SDK:**
- OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`
- Anthropic: `claude-3-5-sonnet`, `claude-3-haiku`
- Google: `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash`

---

#### Q11: Explain the difference between `generateObject()` and `streamObject()` in the AI SDK.

**Answer:**

| Method | Behavior | Use Case |
|--------|----------|----------|
| `generateObject()` | Waits for complete response | Deterministic output, smaller responses |
| `streamObject()` | Streams chunks as generated | Better UX, larger responses |

**Current Implementation** (generateObject):
```typescript
const result = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: responseSchema,
  system: systemPrompt,
  prompt: userQuery
});
// Waits until FULL response is ready
return Response.json(result.object);
```

**Streaming Alternative** (streamObject):
```typescript
const { partialObjectStream } = await streamObject({
  model: google('gemini-2.5-flash'),
  schema: responseSchema,
  system: systemPrompt,
  prompt: userQuery
});

// partialObjectStream is an AsyncIterable
for await (const chunk of partialObjectStream) {
  // Send each chunk to client via WebSocket/SSE
}
```

**Trade-offs:**
- `generateObject`: Simpler, but user waits longer
- `streamObject`: Better UX, more complex to implement

**For this project**, streaming would improve UX significantly - user would see response appearing as it's generated rather than waiting for "thinking..." to complete.

---

## 6. Key Concepts to Know

### Next.js Concepts

| Concept | Where Used | Explanation |
|---------|------------|-------------|
| App Router | `src/app/` | New routing system (vs Pages Router) |
| API Routes | `src/app/api/` | Create API endpoints via route.ts files |
| Dynamic Routes | `export const dynamic = 'force-dynamic'` | Disable static generation for API |
| Client Components | `"use client"` | Components that use React hooks |
| Server Components | Default | Components that run on server only |
| Layouts | `layout.tsx` | Wrap pages, share UI, fonts |

### React Concepts

| Concept | Where Used | Explanation |
|---------|------------|-------------|
| useState | `messages`, `input`, `loading` | Local component state |
| useEffect | Auto-scroll, typewriter | Side effects (mount, update) |
| useRef | `messagesEndRef`, `textareaRef` | Direct DOM access |
| TypeScript Interfaces | `AIMessage`, `UserMessage` | Type definitions |

### AI/SDK Concepts

| Concept | Explanation |
|---------|-------------|
| System Prompt | Instructions defining AI persona/behavior |
| Structured Output | AI returns typed JSON (not plain text) |
| Zod Schema | Defines expected JSON structure |
| Streaming | Real-time response as it's generated |

---

## 7. Potential Questions & How to Answer

### "Walk me through your project"

**Answer Structure:**
1. One-line pitch: "LakshyaGPT is a ChatGPT-style chatbot that deliberately gives wrong but believable answers - it's designed to be humorously misleading"
2. Tech stack: "Built with Next.js, React, TypeScript, and uses Google's Gemini AI via Vercel AI SDK"
3. Key feature: "The UI has glassmorphism design, typewriter effects, and a fact-check feature that reveals the deception"
4. What you learned: "Full-stack development, AI integration, working with APIs"

---

### "What challenges did you face?"

**Good answers:**
- Getting the AI to consistently lie confidently (prompt engineering)
- Implementing smooth typewriter effect with proper timing
- Handling API errors gracefully
- Making the UI responsive across devices

---

### "Why did you choose this tech stack?"

**Answer:**
- Next.js: Wanted to learn modern React framework with App Router
- Vercel AI SDK: Provides unified interface for AI models, makes it easy to switch providers
- Google Gemini: Good free tier, strong structured output capabilities
- TypeScript: Catches errors at compile time, better IDE support

---

### "How would you improve this?"

**Answer:**
- Add message persistence (LocalStorage or database)
- Implement streaming for better UX
- Add rate limiting to protect API
- Add user authentication
- Include actual fact-checking (not just reveal lies)

---

### "Explain [specific code line]"

Be ready to explain ANY line in:
- route.ts - The AI call, Zod schema, error handling
- page.tsx - State management, Typewriter, handleSubmit
- globals.css - Glassmorphism, animations

---

## 8. Project Limitations & Improvements

### Current Limitations

| Limitation | Impact |
|------------|--------|
| No persistence | Messages lost on refresh |
| No streaming | Slow perceived response |
| No rate limiting | Can abuse API |
| No auth | Anyone can use |
| Single model | No fallback |

### Planned Improvements (if asked)

1. **Message Persistence** - Save to LocalStorage or database
2. **Streaming Responses** - Use streamObject() for real-time display
3. **Rate Limiting** - Protect against abuse
4. **Authentication** - User accounts
5. **Multiple AI Providers** - Fallback if one fails

---

## 9. Quick Reference

### Key Files to Remember

| File | Lines to Know | Purpose |
|------|---------------|---------|
| `route.ts` | 32-37 | AI SDK call |
| `route.ts` | 19-22 | Zod schema |
| `route.ts` | 25-29 | System prompt |
| `page.tsx` | 117-158 | handleSubmit function |
| `page.tsx` | 430-466 | Typewriter component |
| `globals.css` | 172-189 | Glassmorphism panel |

### Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Variables

```bash
GEMINI_API_KEY=your_api_key_here
```

Get free key from: https://aistudio.google.com/app/apikey

---

## 🎯 Final Tips for Your Interview

1. **Know your code** - Be ready to explain any line
2. **Explain WHY** - Not just what, but why you chose it
3. **Be honest** - Say "I don't know" if needed, it's okay
4. **Show learning** - Mention what you'd improve
5. **Practice the walkthrough** - Say it out loud before the interview

**Good luck with your TCS Prime interview!** 🚀

---

*Document generated: August 6, 2026*
*Project: LakshyaGPT v0.1.0*
