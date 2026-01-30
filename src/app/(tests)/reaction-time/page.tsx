"use client";

// TODO: Anti-cheat
// - Detect autoclickers (suspiciously consistent sub-100ms times)
// - Flag scores below human-possible thresholds (~120ms)
// - Add server-side validation when Supabase is integrated

// TODO: Enhancements
// - Add visual feedback animation on click (ripple effect)
// - Show distribution chart of all 5 attempts on result
// - Add "best of 5" vs "average of 5" toggle

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";

type RTState = "waiting" | "ready" | "toosoon" | "result";

const TOTAL_ROUNDS = 5;

function ReactionTimeGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [state, setState] = useState<RTState>("waiting");
  const [attempts, setAttempts] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [round, setRound] = useState(0);
  const [earlyClicks, setEarlyClicks] = useState(0);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRound = useCallback(() => {
    setState("waiting");
    const delay = 1000 + Math.random() * 4000; // 1-5 seconds
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setState("ready");
    }, delay);
  }, []);

  useEffect(() => {
    startRound();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [startRound]);

  const handleClick = useCallback(() => {
    if (state === "waiting") {
      // Clicked too early
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setEarlyClicks((c) => c + 1);
      setState("toosoon");
    } else if (state === "ready") {
      const reactionTime = performance.now() - startTimeRef.current;
      setCurrentTime(Math.round(reactionTime));
      const newAttempts = [...attempts, Math.round(reactionTime)];
      setAttempts(newAttempts);

      if (newAttempts.length >= TOTAL_ROUNDS) {
        const avg = Math.round(mean(newAttempts));
        onComplete(avg, { attempts: newAttempts, earlyClicks });
        return;
      }
      setRound((r) => r + 1);
      setState("result");
    } else if (state === "toosoon") {
      startRound();
    } else if (state === "result") {
      startRound();
    }
  }, [state, attempts, earlyClicks, onComplete, startRound]);

  const bgColor = {
    waiting: "bg-red-600",
    ready: "bg-green-500",
    toosoon: "bg-surface",
    result: "bg-accent/20",
  }[state];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`fixed inset-0 flex flex-col items-center justify-center cursor-pointer select-none transition-colors duration-200 ${bgColor}`}
      onClick={handleClick}
    >
      {state === "waiting" && (
        <div className="text-center">
          <p className="text-3xl font-bold text-white">Wait for green...</p>
          <p className="mt-2 text-white/70">Round {round + 1} of {TOTAL_ROUNDS}</p>
        </div>
      )}
      {state === "ready" && (
        <div className="text-center">
          <p className="text-3xl font-bold text-white">Click!</p>
        </div>
      )}
      {state === "toosoon" && (
        <div className="text-center">
          <p className="text-3xl font-bold text-error">Too soon!</p>
          <p className="mt-2 text-muted">Click to try again</p>
        </div>
      )}
      {state === "result" && (
        <div className="text-center">
          <p className="text-lg text-muted">Reaction Time</p>
          <p className="text-5xl font-bold font-mono text-accent">{currentTime} ms</p>
          <p className="mt-4 text-muted">Click to continue ({round + 1} of {TOTAL_ROUNDS})</p>
        </div>
      )}
    </motion.div>
  );
}

export default function ReactionTimePage() {
  const config = testMap["reaction-time"];
  return (
    <TestShell config={config}>
      {({ onComplete }) => <ReactionTimeGame onComplete={onComplete} />}
    </TestShell>
  );
}
