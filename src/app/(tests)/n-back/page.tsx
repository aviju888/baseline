"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { motion } from "framer-motion";
import type { NBackSettings } from "@/lib/tests/difficulty";

const GRID_SIZE = 3;
const DEFAULT_SEQUENCE_LENGTH = 20;
const DEFAULT_DISPLAY_TIME = 2000;
const DEFAULT_N = 2;
const MATCH_PROBABILITY = 0.3;

function generateSequence(n: number, sequenceLength: number): { positions: number[]; matches: boolean[] } {
  const totalCells = GRID_SIZE * GRID_SIZE;
  const positions: number[] = [];
  const matches: boolean[] = [];

  for (let i = 0; i < sequenceLength; i++) {
    if (i >= n && Math.random() < MATCH_PROBABILITY) {
      // Make it a match
      positions.push(positions[i - n]);
      matches.push(true);
    } else {
      // Make it a non-match
      let pos: number;
      do {
        pos = Math.floor(Math.random() * totalCells);
      } while (i >= n && pos === positions[i - n]);
      positions.push(pos);
      matches.push(false);
    }
  }

  return { positions, matches };
}

function NBackGame({
  onComplete,
  settings,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  settings?: NBackSettings;
}) {
  const n = settings?.n ?? DEFAULT_N;
  const sequenceLength = settings?.sequenceLength ?? DEFAULT_SEQUENCE_LENGTH;
  const displayTime = settings?.displayTime ?? DEFAULT_DISPLAY_TIME;

  const [sequenceData] = useState(() => generateSequence(n, sequenceLength));
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
      if (next >= sequenceData.positions.length) return prev; // will be handled by effect
      return next;
    });
    setResponded(false);
    setFeedback(null);
  }, [sequenceData.positions.length]);

  useEffect(() => {
    if (currentIndex >= sequenceLength) {
      // Game over
      const totalMatches = sequenceData.matches.filter(Boolean).length;
      const accuracy = totalMatches > 0 ? Math.round((hits / Math.max(1, totalMatches)) * 100) : 100;
      const score = Math.max(0, hits * 10 - falseAlarms * 5);
      onComplete(score, {
        n,
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
    }, displayTime);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, sequenceData, responded, advanceSequence, hits, misses, falseAlarms, correctRejects, onComplete, n, sequenceLength, displayTime]);

  const handleMatch = useCallback(() => {
    if (responded || currentIndex < n) return;
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
          <p className="text-sm text-muted">{n}-Back</p>
          <p className="font-mono font-bold">{currentIndex + 1}/{sequenceLength}</p>
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
        disabled={responded || currentIndex < n}
        className="rounded-lg bg-accent/20 text-accent px-12 py-4 text-lg font-semibold hover:bg-accent/30 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Match!
      </button>

      <p className="text-sm text-muted">
        {currentIndex < n
          ? `Watch the first ${n} positions...`
          : `Press Match if the position is the same as ${n} steps ago`}
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
          position is the same as the one from <strong>N steps ago</strong>. The N value depends on difficulty.
        </p>
      }
    >
      {({ onComplete, settings }) => (
        <NBackGame
          onComplete={onComplete}
          settings={settings as NBackSettings | undefined}
        />
      )}
    </TestShell>
  );
}
