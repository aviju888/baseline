"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";

const TOTAL_ROUNDS = 30;

interface Item {
  text: string;
  category: "alive" | "not-alive";
}

const ITEMS: Item[] = [
  // Alive
  { text: "Dog", category: "alive" },
  { text: "Cat", category: "alive" },
  { text: "Tree", category: "alive" },
  { text: "Fish", category: "alive" },
  { text: "Flower", category: "alive" },
  { text: "Bird", category: "alive" },
  { text: "Spider", category: "alive" },
  { text: "Mushroom", category: "alive" },
  { text: "Whale", category: "alive" },
  { text: "Frog", category: "alive" },
  { text: "Grass", category: "alive" },
  { text: "Snake", category: "alive" },
  { text: "Bee", category: "alive" },
  { text: "Cactus", category: "alive" },
  { text: "Shark", category: "alive" },
  // Not alive
  { text: "Rock", category: "not-alive" },
  { text: "Car", category: "not-alive" },
  { text: "Book", category: "not-alive" },
  { text: "Cloud", category: "not-alive" },
  { text: "Phone", category: "not-alive" },
  { text: "Chair", category: "not-alive" },
  { text: "Lamp", category: "not-alive" },
  { text: "Water", category: "not-alive" },
  { text: "Coin", category: "not-alive" },
  { text: "Shoe", category: "not-alive" },
  { text: "Clock", category: "not-alive" },
  { text: "Key", category: "not-alive" },
  { text: "Glass", category: "not-alive" },
  { text: "Pencil", category: "not-alive" },
  { text: "Fire", category: "not-alive" },
];

function DecisionSpeedGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const [item, setItem] = useState<Item>(() => ITEMS[Math.floor(Math.random() * ITEMS.length)]);
  const [times, setTimes] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const trialStartRef = useRef(performance.now());

  useEffect(() => {
    trialStartRef.current = performance.now();
  }, [item]);

  const handleAnswer = useCallback(
    (answer: "alive" | "not-alive") => {
      const rt = performance.now() - trialStartRef.current;
      const isCorrect = answer === item.category;

      if (isCorrect) {
        setCorrect((c) => c + 1);
        setTimes((t) => [...t, rt]);
      }

      setFeedback(isCorrect ? "correct" : "wrong");

      setTimeout(() => {
        setFeedback(null);
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          const allTimes = isCorrect ? [...times, rt] : times;
          const avg = allTimes.length > 0 ? Math.round(mean(allTimes)) : 999;
          onComplete(avg, { correct: isCorrect ? correct + 1 : correct, total: TOTAL_ROUNDS });
          return;
        }
        setRound(nextRound);
        setItem(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
      }, 250);
    },
    [item, round, times, correct, onComplete]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm text-muted">Round</p>
          <p className="font-mono font-bold">{round + 1}/{TOTAL_ROUNDS}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Correct</p>
          <p className="font-mono font-bold text-success">{correct}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted mb-4">Alive or Not Alive?</p>
        <motion.p
          key={item.text}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold"
        >
          {item.text}
        </motion.p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleAnswer("alive")}
          className="rounded-lg bg-success/20 text-success px-8 py-4 text-lg font-semibold hover:bg-success/30 transition-colors cursor-pointer"
        >
          Alive
        </button>
        <button
          onClick={() => handleAnswer("not-alive")}
          className="rounded-lg bg-error/20 text-error px-8 py-4 text-lg font-semibold hover:bg-error/30 transition-colors cursor-pointer"
        >
          Not Alive
        </button>
      </div>

      {feedback && (
        <p className={`text-sm font-medium ${feedback === "correct" ? "text-success" : "text-error"}`}>
          {feedback === "correct" ? "Correct!" : "Wrong!"}
        </p>
      )}
    </motion.div>
  );
}

export default function DecisionSpeedPage() {
  const config = testMap["decision-speed"];
  return (
    <TestShell
      config={config}
      instructions={<p>Items will appear on screen. Quickly decide if each one is alive or not alive. Speed and accuracy both count.</p>}
    >
      {({ onComplete }) => <DecisionSpeedGame onComplete={onComplete} />}
    </TestShell>
  );
}
