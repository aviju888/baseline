"use client";

import { useState, useCallback, useRef } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";
import type { AimTrainerSettings } from "@/lib/tests/difficulty";

const DEFAULT_TOTAL_TARGETS = 30;
const DEFAULT_TARGET_SIZE = 60;

function AimTrainerGame({
  onComplete,
  settings,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  settings?: AimTrainerSettings;
}) {
  const totalTargets = settings?.totalTargets ?? DEFAULT_TOTAL_TARGETS;
  const targetSize = settings?.targetSize ?? DEFAULT_TARGET_SIZE;

  const [target, setTarget] = useState({ x: 50, y: 50 });
  const [times, setTimes] = useState<number[]>([]);
  const [remaining, setRemaining] = useState(totalTargets);
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
      className="w-full px-4"
    >
      <div
        ref={containerRef}
        className="relative w-full h-[75vh] max-h-[800px] rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
      >
        {/* Remaining counter overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/[0.06]">
          <span className="text-sm text-muted">Remaining: </span>
          <span className="font-mono font-bold text-foreground">{remaining}</span>
        </div>

        <button
          onClick={handleTargetClick}
          className="absolute rounded-full bg-accent hover:bg-accent-hover transition-all duration-100 cursor-crosshair hover:scale-95 active:scale-90"
          style={{
            width: targetSize,
            height: targetSize,
            left: `calc(${target.x}% - ${targetSize / 2}px)`,
            top: `calc(${target.y}% - ${targetSize / 2}px)`,
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
      {({ onComplete, settings }) => (
        <AimTrainerGame
          onComplete={onComplete}
          settings={settings as AimTrainerSettings | undefined}
        />
      )}
    </TestShell>
  );
}
