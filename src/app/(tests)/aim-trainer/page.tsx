"use client";

import { useState, useCallback, useRef } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";

const TOTAL_TARGETS = 30;
const TARGET_SIZE = 60;

function AimTrainerGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const [times, setTimes] = useState<number[]>([]);
  const [remaining, setRemaining] = useState(TOTAL_TARGETS);
  const lastClickRef = useRef(performance.now());
  const containerRef = useRef<HTMLDivElement>(null);

  const randomPosition = useCallback(() => {
    const padding = 10;
    return {
      x: padding + Math.random() * (100 - padding * 2),
      y: padding + Math.random() * (100 - padding * 2),
    };
  }, []);

  const handleTargetClick = useCallback(() => {
    const now = performance.now();
    const elapsed = now - lastClickRef.current;
    lastClickRef.current = now;

    const newTimes = [...times, Math.round(elapsed)];
    setTimes(newTimes);

    const left = remaining - 1;
    setRemaining(left);

    if (left <= 0) {
      const avg = Math.round(mean(newTimes));
      onComplete(avg, { times: newTimes });
      return;
    }

    setTarget(randomPosition());
  }, [times, remaining, onComplete, randomPosition]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="text-center">
        <p className="text-sm text-muted">Remaining</p>
        <p className="text-2xl font-bold font-mono">{remaining}</p>
      </div>

      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] max-w-2xl rounded-xl border border-border bg-surface overflow-hidden"
      >
        <button
          onClick={handleTargetClick}
          className="absolute rounded-full bg-accent hover:bg-accent-hover transition-colors cursor-pointer shadow-lg shadow-accent/30"
          style={{
            width: TARGET_SIZE,
            height: TARGET_SIZE,
            left: `calc(${target.x}% - ${TARGET_SIZE / 2}px)`,
            top: `calc(${target.y}% - ${TARGET_SIZE / 2}px)`,
          }}
        />
      </div>
    </motion.div>
  );
}

export default function AimTrainerPage() {
  const config = testMap["aim-trainer"];
  return (
    <TestShell config={config} showCountdown>
      {({ onComplete }) => <AimTrainerGame onComplete={onComplete} />}
    </TestShell>
  );
}
