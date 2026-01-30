"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { motion } from "framer-motion";

const DURATION = 60_000; // 60 seconds

interface Problem {
  text: string;
  answer: number;
}

function generateProblem(difficulty: number): Problem {
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * Math.min(ops.length, 1 + difficulty))];

  let a: number, b: number, answer: number;

  const maxNum = Math.min(10 + difficulty * 5, 99);

  if (op === "+") {
    a = Math.floor(Math.random() * maxNum) + 1;
    b = Math.floor(Math.random() * maxNum) + 1;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * maxNum) + 1;
    b = Math.floor(Math.random() * a) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * Math.min(maxNum, 12)) + 2;
    b = Math.floor(Math.random() * Math.min(maxNum, 12)) + 2;
    answer = a * b;
  }

  return { text: `${a} ${op} ${b}`, answer };
}

function MentalMathGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [problem, setProblem] = useState<Problem>(() => generateProblem(0));
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const left = Math.max(0, Math.ceil((DURATION - elapsed) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete(score, { streak });
    }
  }, [timeLeft, score, streak, onComplete]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (timeLeft <= 0) return;
      const parsed = parseInt(input, 10);
      if (parsed === problem.answer) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setScore((s) => s + 1);
        const difficulty = Math.floor(newStreak / 3);
        setProblem(generateProblem(difficulty));
      } else {
        setStreak(0);
        setProblem(generateProblem(0));
      }
      setInput("");
      inputRef.current?.focus();
    },
    [input, problem, streak, timeLeft]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="flex gap-8 text-center">
        <div>
          <p className="text-sm text-muted">Time</p>
          <p className="text-2xl font-bold font-mono">{timeLeft}s</p>
        </div>
        <div>
          <p className="text-sm text-muted">Score</p>
          <p className="text-2xl font-bold font-mono text-accent">{score}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Streak</p>
          <p className="text-2xl font-bold font-mono">{streak}</p>
        </div>
      </div>

      <div className="text-5xl font-bold font-mono">{problem.text} = ?</div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          ref={inputRef}
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={timeLeft <= 0}
          className="w-32 rounded-lg border border-border bg-surface-light px-4 py-3 text-center text-2xl font-mono focus:border-accent focus:outline-none disabled:opacity-50"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={timeLeft <= 0}
          className="rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
        >
          →
        </button>
      </form>
    </motion.div>
  );
}

export default function MentalMathPage() {
  const config = testMap["mental-math"];
  return (
    <TestShell
      config={config}
      instructions={<p>Solve as many arithmetic problems as you can in 60 seconds. Problems get harder as you build a streak.</p>}
      showCountdown
    >
      {({ onComplete }) => <MentalMathGame onComplete={onComplete} />}
    </TestShell>
  );
}
