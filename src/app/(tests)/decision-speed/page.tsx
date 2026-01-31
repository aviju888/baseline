"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_ROUNDS = 30;

type Category = {
  question: string;
  optionA: string;
  optionB: string;
  items: { text: string; answer: "A" | "B" }[];
};

const CATEGORIES: Category[] = [
  {
    question: "Bigger than a basketball?",
    optionA: "Yes",
    optionB: "No",
    items: [
      { text: "Elephant", answer: "A" },
      { text: "Car", answer: "A" },
      { text: "House", answer: "A" },
      { text: "Giraffe", answer: "A" },
      { text: "Piano", answer: "A" },
      { text: "Refrigerator", answer: "A" },
      { text: "Apple", answer: "B" },
      { text: "Phone", answer: "B" },
      { text: "Coin", answer: "B" },
      { text: "Mouse", answer: "B" },
      { text: "Key", answer: "B" },
      { text: "Egg", answer: "B" },
    ],
  },
  {
    question: "Can it fly?",
    optionA: "Yes",
    optionB: "No",
    items: [
      { text: "Eagle", answer: "A" },
      { text: "Airplane", answer: "A" },
      { text: "Butterfly", answer: "A" },
      { text: "Helicopter", answer: "A" },
      { text: "Bee", answer: "A" },
      { text: "Bat", answer: "A" },
      { text: "Penguin", answer: "B" },
      { text: "Fish", answer: "B" },
      { text: "Car", answer: "B" },
      { text: "Dog", answer: "B" },
      { text: "Rock", answer: "B" },
      { text: "Tree", answer: "B" },
    ],
  },
  {
    question: "Is it edible?",
    optionA: "Yes",
    optionB: "No",
    items: [
      { text: "Apple", answer: "A" },
      { text: "Bread", answer: "A" },
      { text: "Cheese", answer: "A" },
      { text: "Carrot", answer: "A" },
      { text: "Rice", answer: "A" },
      { text: "Chicken", answer: "A" },
      { text: "Rock", answer: "B" },
      { text: "Phone", answer: "B" },
      { text: "Chair", answer: "B" },
      { text: "Car", answer: "B" },
      { text: "Shoe", answer: "B" },
      { text: "Glass", answer: "B" },
    ],
  },
  {
    question: "Found in a kitchen?",
    optionA: "Yes",
    optionB: "No",
    items: [
      { text: "Spoon", answer: "A" },
      { text: "Oven", answer: "A" },
      { text: "Knife", answer: "A" },
      { text: "Plate", answer: "A" },
      { text: "Fridge", answer: "A" },
      { text: "Pan", answer: "A" },
      { text: "Bed", answer: "B" },
      { text: "Car", answer: "B" },
      { text: "Tree", answer: "B" },
      { text: "Tennis", answer: "B" },
      { text: "Guitar", answer: "B" },
      { text: "Bicycle", answer: "B" },
    ],
  },
  {
    question: "Is it alive?",
    optionA: "Yes",
    optionB: "No",
    items: [
      { text: "Dog", answer: "A" },
      { text: "Tree", answer: "A" },
      { text: "Fish", answer: "A" },
      { text: "Spider", answer: "A" },
      { text: "Flower", answer: "A" },
      { text: "Bird", answer: "A" },
      { text: "Rock", answer: "B" },
      { text: "Car", answer: "B" },
      { text: "Phone", answer: "B" },
      { text: "Chair", answer: "B" },
      { text: "Clock", answer: "B" },
      { text: "Water", answer: "B" },
    ],
  },
];

function DecisionSpeedGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const [category, setCategory] = useState<Category>(() => CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]);
  const [item, setItem] = useState(() => category.items[Math.floor(Math.random() * category.items.length)]);
  const [times, setTimes] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const trialStartRef = useRef(performance.now());

  useEffect(() => {
    trialStartRef.current = performance.now();
  }, [item]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        handleAnswer("A");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        handleAnswer("B");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleAnswer = useCallback(
    (answer: "A" | "B") => {
      if (feedback) return;
      const rt = performance.now() - trialStartRef.current;
      const isCorrect = answer === item.answer;

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

        // Switch category every 10 rounds
        if (nextRound % 10 === 0) {
          const newCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
          setCategory(newCat);
          setItem(newCat.items[Math.floor(Math.random() * newCat.items.length)]);
        } else {
          setItem(category.items[Math.floor(Math.random() * category.items.length)]);
        }
      }, 200);
    },
    [item, round, times, correct, onComplete, category, feedback]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto px-4"
    >
      {/* Stats bar */}
      <div className="flex gap-8 text-center">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">Round</p>
          <p className="text-2xl font-mono font-bold">{round + 1}<span className="text-muted">/{TOTAL_ROUNDS}</span></p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">Correct</p>
          <p className="text-2xl font-mono font-bold text-success">{correct}</p>
        </div>
      </div>

      {/* Question */}
      <div className="text-center">
        <p className="text-lg text-muted">{category.question}</p>
      </div>

      {/* Word display */}
      <div className="h-32 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={item.text + round}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="text-6xl sm:text-7xl font-bold"
          >
            {item.text}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={() => handleAnswer("A")}
          disabled={feedback !== null}
          className="flex-1 rounded-xl bg-accent/10 border border-accent/20 text-accent px-6 py-5 text-xl font-semibold hover:bg-accent/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="block text-sm text-accent/60 mb-1">← A</span>
          {category.optionA}
        </button>
        <button
          onClick={() => handleAnswer("B")}
          disabled={feedback !== null}
          className="flex-1 rounded-xl bg-violet/10 border border-violet/20 text-violet px-6 py-5 text-xl font-semibold hover:bg-violet/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="block text-sm text-violet/60 mb-1">D →</span>
          {category.optionB}
        </button>
      </div>

      {/* Feedback */}
      <div className="h-6">
        {feedback && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-medium ${feedback === "correct" ? "text-success" : "text-error"}`}
          >
            {feedback === "correct" ? "Correct!" : "Wrong!"}
          </motion.p>
        )}
      </div>

      {/* Hint */}
      <p className="text-xs text-muted/60">Use A/D or ←/→ keys</p>
    </motion.div>
  );
}

export default function DecisionSpeedPage() {
  const config = testMap["decision-speed"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          Words will appear on screen. Quickly categorize each one based on the question shown.
          The category changes every 10 rounds. Use keyboard shortcuts for faster responses.
        </p>
      }
    >
      {({ onComplete }) => <DecisionSpeedGame onComplete={onComplete} />}
    </TestShell>
  );
}
