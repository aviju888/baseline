"use client";

import { useState, useCallback } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { motion } from "framer-motion";

const TOTAL_ROUNDS = 10;

interface Pattern {
  sequence: number[];
  answer: number;
  options: number[];
  rule: string;
}

function generatePattern(difficulty: number): Pattern {
  const patterns = [
    // Addition patterns
    () => {
      const start = Math.floor(Math.random() * 10) + 1;
      const step = Math.floor(Math.random() * (3 + difficulty)) + 1;
      const seq = Array.from({ length: 5 }, (_, i) => start + step * i);
      const answer = seq.pop()!;
      return { seq, answer, rule: `+${step}` };
    },
    // Multiplication patterns
    () => {
      const start = Math.floor(Math.random() * 3) + 2;
      const mult = Math.floor(Math.random() * 2) + 2;
      const seq = Array.from({ length: 5 }, (_, i) => start * Math.pow(mult, i));
      const answer = seq.pop()!;
      return { seq, answer, rule: `×${mult}` };
    },
    // Alternating patterns
    () => {
      const a = Math.floor(Math.random() * 10) + 1;
      const stepA = Math.floor(Math.random() * 5) + 2;
      const stepB = Math.floor(Math.random() * 5) + 1;
      const seq: number[] = [];
      for (let i = 0; i < 6; i++) {
        seq.push(a + Math.floor(i / 2) * stepA + (i % 2) * stepB);
      }
      const answer = seq.pop()!;
      return { seq, answer, rule: "alternating" };
    },
    // Square numbers
    () => {
      const offset = Math.floor(Math.random() * 5);
      const seq = Array.from({ length: 5 }, (_, i) => (i + 1 + offset) ** 2);
      const answer = seq.pop()!;
      return { seq, answer, rule: "squares" };
    },
    // Fibonacci-like
    () => {
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 3) + 1;
      const seq = [a, b];
      for (let i = 2; i < 6; i++) {
        seq.push(seq[i - 1] + seq[i - 2]);
      }
      const answer = seq.pop()!;
      return { seq, answer, rule: "fibonacci" };
    },
  ];

  const ruleNames = ["addition", "multiplication", "alternating", "squares", "fibonacci"];
  const maxPattern = Math.min(patterns.length, 2 + difficulty);
  const idx = Math.floor(Math.random() * maxPattern);
  const { seq, answer } = patterns[idx]();

  // Generate distractors
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    if (offset !== 0) options.add(answer + offset);
  }

  return {
    sequence: seq,
    answer,
    options: [...options].sort((a, b) => a - b),
    rule: ruleNames[idx],
  };
}

function PatternRecognitionGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [pattern, setPattern] = useState<Pattern>(() => generatePattern(0));
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const handleAnswer = useCallback(
    (choice: number) => {
      if (feedback) return;
      const isCorrect = choice === pattern.answer;
      if (isCorrect) setScore((s) => s + 1);

      setFeedback(isCorrect ? "correct" : "wrong");

      setTimeout(() => {
        setFeedback(null);
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          onComplete(isCorrect ? score + 1 : score, { total: TOTAL_ROUNDS });
          return;
        }
        setRound(nextRound);
        setPattern(generatePattern(Math.floor(nextRound / 2)));
      }, 500);
    },
    [feedback, pattern, round, score, onComplete]
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
          <p className="text-sm text-muted">Score</p>
          <p className="font-mono font-bold text-accent">{score}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted mb-4">What comes next?</p>
        <div className="flex items-center gap-3 text-3xl font-mono font-bold">
          {pattern.sequence.map((n, i) => (
            <span key={i}>
              {i > 0 && <span className="text-muted mx-1">,</span>}
              {n}
            </span>
          ))}
          <span className="text-accent ml-1">?</span>
        </div>
      </div>

      <div className="flex gap-3">
        {pattern.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="rounded-lg border border-border bg-surface-light px-6 py-3 font-mono text-lg font-medium hover:border-accent hover:bg-accent/10 transition-all cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback && (
        <p className={`text-sm font-medium ${feedback === "correct" ? "text-success" : "text-error"}`}>
          {feedback === "correct" ? "Correct!" : `Wrong! Answer: ${pattern.answer}`}
        </p>
      )}
    </motion.div>
  );
}

export default function PatternRecognitionPage() {
  const config = testMap["pattern-recognition"];
  return (
    <TestShell
      config={config}
      instructions={<p>Find the pattern in the number sequence and choose what comes next. Patterns get more complex as you progress.</p>}
    >
      {({ onComplete }) => <PatternRecognitionGame onComplete={onComplete} />}
    </TestShell>
  );
}
