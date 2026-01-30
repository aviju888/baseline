"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { motion } from "framer-motion";

const GRID_SIZE = 3;
const SEQUENCE_LENGTH = 20;
const DISPLAY_TIME = 2000; // ms each stimulus is shown
const N = 2;
const MATCH_PROBABILITY = 0.3;

function generateSequence(): { positions: number[]; matches: boolean[] } {
  const totalCells = GRID_SIZE * GRID_SIZE;
  const positions: number[] = [];
  const matches: boolean[] = [];

  for (let i = 0; i < SEQUENCE_LENGTH; i++) {
    if (i >= N && Math.random() < MATCH_PROBABILITY) {
      // Make it a match
      positions.push(positions[i - N]);
      matches.push(true);
    } else {
      // Make it a non-match
      let pos: number;
      do {
        pos = Math.floor(Math.random() * totalCells);
      } while (i >= N && pos === positions[i - N]);
      positions.push(pos);
      matches.push(false);
    }
  }

  return { positions, matches };
}

function NBackGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [sequenceData] = useState(() => generateSequence());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [responded, setResponded] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [correctRejects, setCorrectRejects] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceSequence = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= SEQUENCE_LENGTH) return prev; // will be handled by effect
      return next;
    });
    setResponded(false);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (currentIndex >= SEQUENCE_LENGTH) {
      // Game over
      const totalMatches = sequenceData.matches.filter(Boolean).length;
      const accuracy = totalMatches > 0 ? Math.round((hits / Math.max(1, totalMatches)) * 100) : 100;
      const score = Math.max(0, hits * 10 - falseAlarms * 5);
      onComplete(score, {
        n: N,
        hits,
        misses,
        falseAlarms,
        correctRejects,
        accuracy,
      });
      return;
    }

    setActiveCell(sequenceData.positions[currentIndex]);

    timerRef.current = setTimeout(() => {
      // If they didn't respond and it was a match, count as miss
      if (!responded && sequenceData.matches[currentIndex]) {
        setMisses((m) => m + 1);
      } else if (!responded && !sequenceData.matches[currentIndex]) {
        setCorrectRejects((c) => c + 1);
      }
      setActiveCell(null);
      setTimeout(advanceSequence, 300);
    }, DISPLAY_TIME);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, sequenceData, responded, advanceSequence, hits, misses, falseAlarms, correctRejects, onComplete]);

  const handleMatch = useCallback(() => {
    if (responded || currentIndex < N) return;
    setResponded(true);

    if (sequenceData.matches[currentIndex]) {
      setHits((h) => h + 1);
      setFeedback("Hit!");
    } else {
      setFalseAlarms((f) => f + 1);
      setFeedback("False alarm");
    }
  }, [responded, currentIndex, sequenceData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm text-muted">{N}-Back</p>
          <p className="font-mono font-bold">{currentIndex + 1}/{SEQUENCE_LENGTH}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Hits</p>
          <p className="font-mono font-bold text-success">{hits}</p>
        </div>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <div
            key={i}
            className={`h-20 w-20 sm:h-24 sm:w-24 rounded-lg transition-all duration-150 ${
              activeCell === i
                ? "bg-accent scale-95"
                : "bg-surface-light"
            }`}
          />
        ))}
      </div>

      <button
        onClick={handleMatch}
        disabled={responded || currentIndex < N}
        className="rounded-lg bg-accent/20 text-accent px-12 py-4 text-lg font-semibold hover:bg-accent/30 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Match!
      </button>

      <p className="text-sm text-muted">
        {currentIndex < N
          ? `Watch the first ${N} positions...`
          : "Press Match if the position is the same as 2 steps ago"}
      </p>

      {feedback && (
        <p className={`text-sm font-medium ${feedback === "Hit!" ? "text-success" : "text-error"}`}>
          {feedback}
        </p>
      )}
    </motion.div>
  );
}

export default function NBackPage() {
  const config = testMap["n-back"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          A tile will light up on a 3x3 grid in sequence. Press &quot;Match&quot; when the current
          position is the same as the one from <strong>{N} steps ago</strong>.
        </p>
      }
    >
      {({ onComplete }) => <NBackGame onComplete={onComplete} />}
    </TestShell>
  );
}
