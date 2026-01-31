"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";
import type { StroopTestSettings } from "@/lib/tests/difficulty";

const COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
];

const DEFAULT_TOTAL_ROUNDS = 20;
const DEFAULT_INCONGRUENT_PROB = 0.7;

interface Trial {
  word: string;
  inkColor: typeof COLORS[number];
  isCongruent: boolean;
}

function generateTrial(incongruentProbability: number): Trial {
  const wordIndex = Math.floor(Math.random() * COLORS.length);
  let colorIndex: number;

  if (Math.random() < incongruentProbability) {
    do {
      colorIndex = Math.floor(Math.random() * COLORS.length);
    } while (colorIndex === wordIndex);
  } else {
    colorIndex = wordIndex;
  }

  return {
    word: COLORS[wordIndex].name,
    inkColor: COLORS[colorIndex],
    isCongruent: wordIndex === colorIndex,
  };
}

function StroopGame({
  onComplete,
  settings,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  settings?: StroopTestSettings;
}) {
  const totalRounds = settings?.totalRounds ?? DEFAULT_TOTAL_ROUNDS;
  const incongruentProbability = settings?.incongruentProbability ?? DEFAULT_INCONGRUENT_PROB;

  const [trial, setTrial] = useState<Trial>(() => generateTrial(incongruentProbability));
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const trialStartRef = useRef(performance.now());

  useEffect(() => {
    trialStartRef.current = performance.now();
  }, [trial]);

  const handleAnswer = useCallback(
    (colorName: string) => {
      const rt = performance.now() - trialStartRef.current;
      const isCorrect = colorName === trial.inkColor.name;

      if (isCorrect) {
        setCorrect((c) => c + 1);
        setTimes((t) => [...t, rt]);
      }

      setFeedback(isCorrect ? "correct" : "wrong");

      setTimeout(() => {
        setFeedback(null);
        const nextRound = round + 1;
        if (nextRound >= totalRounds) {
          const allTimes = isCorrect ? [...times, rt] : times;
          const avg = allTimes.length > 0 ? Math.round(mean(allTimes)) : 0;
          onComplete(avg, {
            correct: isCorrect ? correct + 1 : correct,
            total: totalRounds,
            times: allTimes,
          });
          return;
        }
        setRound(nextRound);
        setTrial(generateTrial(incongruentProbability));
      }, 300);
    },
    [trial, round, times, correct, onComplete, totalRounds, incongruentProbability]
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
          <p className="font-mono font-bold">{round + 1}/{totalRounds}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Correct</p>
          <p className="font-mono font-bold text-success">{correct}</p>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted">What COLOR is the text?</p>
        <p
          className="text-6xl font-bold select-none"
          style={{ color: trial.inkColor.value }}
        >
          {trial.word}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {COLORS.map((color) => (
          <button
            key={color.name}
            onClick={() => handleAnswer(color.name)}
            className="rounded-lg px-6 py-3 font-medium text-white transition-all hover:scale-105 cursor-pointer"
            style={{ backgroundColor: color.value }}
          >
            {color.name}
          </button>
        ))}
      </div>

      {feedback && (
        <p
          className={`text-sm font-medium ${
            feedback === "correct" ? "text-success" : "text-error"
          }`}
        >
          {feedback === "correct" ? "Correct!" : "Wrong!"}
        </p>
      )}
    </motion.div>
  );
}

export default function StroopTestPage() {
  const config = testMap["stroop-test"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          A color word will appear in a different ink color.
          Press the button matching the <strong>ink color</strong>, not the word itself.
        </p>
      }
    >
      {({ onComplete, settings }) => (
        <StroopGame
          onComplete={onComplete}
          settings={settings as StroopTestSettings | undefined}
        />
      )}
    </TestShell>
  );
}
