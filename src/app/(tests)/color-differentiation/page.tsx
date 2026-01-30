"use client";

import { useState, useCallback } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { motion } from "framer-motion";

function generateLevel(level: number) {
  const gridSize = Math.min(3 + Math.floor(level / 3), 7);
  const totalTiles = gridSize * gridSize;
  const oddTile = Math.floor(Math.random() * totalTiles);

  // Base color - random hue
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 20);
  const lightness = 40 + Math.floor(Math.random() * 20);

  // Delta decreases with level, clamped so it never inverts
  const delta = Math.max(3, 25 - level * 2);
  const adjustedLightness = Math.min(lightness + delta, 95);

  const baseColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const oddColor = `hsl(${hue}, ${saturation}%, ${adjustedLightness}%)`;

  return { gridSize, totalTiles, oddTile, baseColor, oddColor };
}

function ColorDiffGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [levelData, setLevelData] = useState(() => generateLevel(1));
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const handleTileClick = useCallback(
    (index: number) => {
      if (feedback) return;
      const isCorrect = index === levelData.oddTile;

      setFeedback(isCorrect ? "correct" : "wrong");

      setTimeout(() => {
        setFeedback(null);
        if (isCorrect) {
          const nextLevel = level + 1;
          setLevel(nextLevel);
          setLevelData(generateLevel(nextLevel));
        } else {
          const newLives = lives - 1;
          setLives(newLives);
          if (newLives <= 0) {
            onComplete(level, { maxLevel: level });
            return;
          }
          setLevelData(generateLevel(level));
        }
      }, 400);
    },
    [feedback, levelData, level, lives, onComplete]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="flex gap-8 text-center">
        <div>
          <p className="text-sm text-muted">Level</p>
          <p className="text-2xl font-bold font-mono text-accent">{level}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Lives</p>
          <p className="text-2xl font-bold font-mono text-error">
            {"♥".repeat(lives)}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted">Tap the different shade</p>

      <div
        className="grid gap-1.5 w-fit"
        style={{
          gridTemplateColumns: `repeat(${levelData.gridSize}, 1fr)`,
        }}
      >
        {Array.from({ length: levelData.totalTiles }).map((_, i) => (
          <button
            key={`${level}-${i}`}
            onClick={() => handleTileClick(i)}
            className="rounded-md transition-transform hover:scale-95 cursor-pointer"
            style={{
              width: Math.max(40, 70 - levelData.gridSize * 5),
              height: Math.max(40, 70 - levelData.gridSize * 5),
              backgroundColor:
                i === levelData.oddTile
                  ? levelData.oddColor
                  : levelData.baseColor,
            }}
          />
        ))}
      </div>

      {feedback && (
        <p className={`text-sm font-medium ${feedback === "correct" ? "text-success" : "text-error"}`}>
          {feedback === "correct" ? "Correct!" : "Wrong tile!"}
        </p>
      )}
    </motion.div>
  );
}

export default function ColorDiffPage() {
  const config = testMap["color-differentiation"];
  return (
    <TestShell
      config={config}
      instructions={<p>Find the tile with a slightly different shade of color. The difference gets subtler as you progress.</p>}
    >
      {({ onComplete }) => <ColorDiffGame onComplete={onComplete} />}
    </TestShell>
  );
}
