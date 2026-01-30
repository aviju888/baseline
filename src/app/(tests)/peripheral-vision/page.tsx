"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { motion } from "framer-motion";

const TOTAL_ROUNDS = 20;
const DIRECTIONS = ["top", "bottom", "left", "right"] as const;
type Direction = typeof DIRECTIONS[number];

function PeripheralVisionGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [centerLetter, setCenterLetter] = useState("A");
  const [flashDir, setFlashDir] = useState<Direction | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correctDir, setCorrectDir] = useState<Direction>("top");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTrial = useCallback(() => {
    setFeedback(null);
    setAwaitingAnswer(false);
    setShowFlash(false);

    // Change center letter
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    setCenterLetter(letters[Math.floor(Math.random() * letters.length)]);

    // Random delay before flash
    const delay = 500 + Math.random() * 1500;
    timerRef.current = setTimeout(() => {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      setFlashDir(dir);
      setCorrectDir(dir);
      setShowFlash(true);

      // Flash disappears quickly
      setTimeout(() => {
        setShowFlash(false);
        setAwaitingAnswer(true);
      }, 150);
    }, delay);
  }, []);

  useEffect(() => {
    startTrial();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTrial]);

  const handleAnswer = useCallback(
    (dir: Direction) => {
      if (!awaitingAnswer) return;
      const isCorrect = dir === correctDir;
      if (isCorrect) setScore((s) => s + 1);
      setFeedback(isCorrect ? "correct" : "wrong");
      setAwaitingAnswer(false);

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          onComplete(isCorrect ? score + 1 : score, { total: TOTAL_ROUNDS });
          return;
        }
        setRound(nextRound);
        startTrial();
      }, 600);
    },
    [awaitingAnswer, correctDir, round, score, onComplete, startTrial]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm text-muted">Round</p>
          <p className="font-mono font-bold">{round + 1}/{TOTAL_ROUNDS}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Score</p>
          <p className="font-mono font-bold text-accent">{score}</p>
        </div>
      </div>

      {/* Arena */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-xl border border-border bg-surface flex items-center justify-center">
        {/* Center fixation */}
        <div className="text-4xl font-bold font-mono text-foreground select-none">
          {centerLetter}
        </div>

        {/* Peripheral flash */}
        {showFlash && flashDir === "top" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent" />
        )}
        {showFlash && flashDir === "bottom" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent" />
        )}
        {showFlash && flashDir === "left" && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent" />
        )}
        {showFlash && flashDir === "right" && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent" />
        )}
      </div>

      {/* Answer buttons */}
      {awaitingAnswer ? (
        <div className="text-center space-y-3">
          <p className="text-sm text-muted">Where did the flash appear?</p>
          <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
            <div />
            <button
              onClick={() => handleAnswer("top")}
              className="rounded-lg bg-surface-light px-4 py-2 text-sm font-medium hover:bg-border transition-colors cursor-pointer"
            >
              Top
            </button>
            <div />
            <button
              onClick={() => handleAnswer("left")}
              className="rounded-lg bg-surface-light px-4 py-2 text-sm font-medium hover:bg-border transition-colors cursor-pointer"
            >
              Left
            </button>
            <div />
            <button
              onClick={() => handleAnswer("right")}
              className="rounded-lg bg-surface-light px-4 py-2 text-sm font-medium hover:bg-border transition-colors cursor-pointer"
            >
              Right
            </button>
            <div />
            <button
              onClick={() => handleAnswer("bottom")}
              className="rounded-lg bg-surface-light px-4 py-2 text-sm font-medium hover:bg-border transition-colors cursor-pointer"
            >
              Bottom
            </button>
            <div />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">
          {feedback ? (feedback === "correct" ? "Correct!" : `Wrong! It was ${correctDir}`) : "Keep your eyes on the center letter..."}
        </p>
      )}
    </motion.div>
  );
}

export default function PeripheralVisionPage() {
  const config = testMap["peripheral-vision"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          Focus on the letter in the center of the screen. A brief flash will appear in your
          peripheral vision. Identify which direction it came from (top, bottom, left, or right).
        </p>
      }
    >
      {({ onComplete }) => <PeripheralVisionGame onComplete={onComplete} />}
    </TestShell>
  );
}
