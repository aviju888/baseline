"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { SequenceMemorySettings } from "@/lib/tests/difficulty";

const DEFAULT_GRID_SIZE = 3;
const DEFAULT_INITIAL_LENGTH = 3;
const DEFAULT_FLASH_DURATION = 600;
const DEFAULT_FLASH_GAP = 300;

function SequenceMemoryGame({
  onComplete,
  settings,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  settings?: SequenceMemorySettings;
}) {
  const gridSize = settings?.gridSize ?? DEFAULT_GRID_SIZE;
  const initialLength = settings?.initialLength ?? DEFAULT_INITIAL_LENGTH;
  const flashDuration = settings?.flashDuration ?? DEFAULT_FLASH_DURATION;
  const flashGap = settings?.flashGap ?? DEFAULT_FLASH_GAP;

  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [level, setLevel] = useState(initialLength);
  const [flashedTile, setFlashedTile] = useState<number | null>(null);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const generateSequence = useCallback((length: number) => {
    const totalTiles = gridSize * gridSize;
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * totalTiles));
    }
    return seq;
  }, []);

  const playSequence = useCallback((seq: number[]) => {
    setShowingSequence(true);
    setUserInput([]);
    setWrongTile(null);
    timeoutsRef.current = [];

    seq.forEach((tile, i) => {
      const showTimeout = setTimeout(() => {
        setActiveIndex(tile);
      }, i * (flashDuration + flashGap));

      const hideTimeout = setTimeout(() => {
        setActiveIndex(null);
      }, i * (flashDuration + flashGap) + flashDuration);

      timeoutsRef.current.push(showTimeout, hideTimeout);
    });

    const endTimeout = setTimeout(() => {
      setShowingSequence(false);
    }, seq.length * (flashDuration + flashGap));
    timeoutsRef.current.push(endTimeout);
  }, [flashDuration, flashGap]);

  const startLevel = useCallback(
    (lvl: number) => {
      const seq = generateSequence(lvl);
      setSequence(seq);
      setLevel(lvl);
      playSequence(seq);
    },
    [generateSequence, playSequence]
  );

  useEffect(() => {
    if (!started) {
      setStarted(true);
      startLevel(initialLength);
    }
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [started, startLevel, initialLength]);

  const handleTileClick = useCallback(
    (index: number) => {
      if (showingSequence) return;

      setFlashedTile(index);
      setTimeout(() => setFlashedTile(null), 200);

      const nextInput = [...userInput, index];
      const expectedIndex = userInput.length;

      if (index !== sequence[expectedIndex]) {
        // Wrong tile
        setWrongTile(index);
        onComplete(level - 1, { maxLevel: level - 1, mistakes: 1 });
        return;
      }

      setUserInput(nextInput);

      if (nextInput.length === sequence.length) {
        // Completed level
        setTimeout(() => {
          startLevel(level + 1);
        }, 500);
      }
    },
    [showingSequence, userInput, sequence, level, onComplete, startLevel]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="text-center">
        <p className="text-sm text-muted uppercase tracking-wider">Level</p>
        <p className="text-5xl font-bold font-mono text-accent">{level}</p>
      </div>

      <div
        className="grid gap-3 sm:gap-4"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, i) => (
          <button
            key={i}
            onClick={() => handleTileClick(i)}
            disabled={showingSequence}
            className={cn(
              "h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-xl transition-all duration-150 cursor-pointer",
              activeIndex === i || flashedTile === i
                ? "bg-accent scale-95 shadow-lg shadow-accent/30"
                : wrongTile === i
                ? "bg-error scale-95"
                : "bg-surface-light hover:bg-border-light",
              showingSequence && "cursor-default"
            )}
          />
        ))}
      </div>

      <p className="text-muted text-sm h-5">
        {showingSequence ? (
          <span className="animate-pulse">Watch the sequence...</span>
        ) : !wrongTile ? (
          "Your turn"
        ) : null}
      </p>
    </motion.div>
  );
}

export default function SequenceMemoryPage() {
  const config = testMap["sequence-memory"];
  return (
    <TestShell config={config}>
      {({ onComplete, settings }) => (
        <SequenceMemoryGame
          onComplete={onComplete}
          settings={settings as SequenceMemorySettings | undefined}
        />
      )}
    </TestShell>
  );
}
