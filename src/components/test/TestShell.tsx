"use client";

import { useState, useCallback, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { useStorage } from "@/providers/StorageProvider";
import { useTestState } from "@/hooks/useTestState";
import { InstructionsScreen } from "./InstructionsScreen";
import { ResultsScreen } from "./ResultsScreen";
import { CountdownOverlay } from "./CountdownOverlay";
import { TestErrorBoundary } from "./TestErrorBoundary";
import type { TestConfig, TestPhase } from "@/types/tests";
import type { ScoreEntry, TestHistory } from "@/types/scores";

// TODO: TestShell improvements
// - Add keyboard shortcut to restart (press R)
// - Add "Esc to quit" during active test (confirm dialog)
// - Add difficulty selector on instructions screen (easy/medium/hard)
// - Add sound effects for countdown beeps (3, 2, 1, go!)
// - Add error boundary to catch crashes during tests
// - Add prefers-reduced-motion support (skip animations)

interface TestShellProps {
  config: TestConfig;
  instructions?: React.ReactNode;
  showCountdown?: boolean;
  children: (props: {
    phase: TestPhase;
    onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  }) => React.ReactNode;
}

export function TestShell({
  config,
  instructions,
  showCountdown = false,
  children,
}: TestShellProps) {
  const storage = useStorage();
  const { phase, startCountdown, startTest, finishTest, restart } = useTestState();

  const [lastScore, setLastScore] = useState<number>(0);
  const [history, setHistory] = useState<TestHistory | null>(null);
  const [testStartTime, setTestStartTime] = useState(0);

  // Load history on mount
  useEffect(() => {
    storage.getTestHistory(config.id, config.scoreSortOrder).then(setHistory);
  }, [storage, config.id, config.scoreSortOrder]);

  const handleStart = useCallback(() => {
    if (showCountdown) {
      startCountdown();
    } else {
      setTestStartTime(performance.now());
      startTest();
    }
  }, [showCountdown, startCountdown, startTest]);

  const handleCountdownComplete = useCallback(() => {
    setTestStartTime(performance.now());
    startTest();
  }, [startTest]);

  const handleComplete = useCallback(
    async (score: number, metadata: Record<string, unknown> = {}) => {
      setLastScore(score);
      finishTest();

      const entry: ScoreEntry = {
        id: uuid(),
        testId: config.id,
        score,
        unit: config.scoreUnit,
        timestamp: Date.now(),
        duration: performance.now() - testStartTime,
        metadata,
      };

      await storage.saveScore(entry);
      const updated = await storage.getTestHistory(config.id, config.scoreSortOrder);
      setHistory(updated);
    },
    [config, storage, finishTest, testStartTime]
  );

  const handleRestart = useCallback(() => {
    restart();
  }, [restart]);

  const handleClearHistory = useCallback(async () => {
    await storage.clearTestScores(config.id);
    setHistory(null);
  }, [storage, config.id]);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center">
      {phase === "instructions" && (
        <InstructionsScreen
          title={config.name}
          description={config.description}
          icon={config.icon}
          instructions={instructions}
          onStart={handleStart}
        />
      )}

      {phase === "countdown" && (
        <CountdownOverlay onComplete={handleCountdownComplete} />
      )}

      {phase === "active" && (
        <TestErrorBoundary onReset={handleRestart}>
          {children({ phase, onComplete: handleComplete })}
        </TestErrorBoundary>
      )}

      {phase === "results" && (
        <ResultsScreen
          score={lastScore}
          scoreUnit={config.scoreUnit}
          scoreLabel={config.scoreLabel}
          bestScore={history?.bestScore ?? null}
          averageScore={history?.averageScore ?? null}
          attempts={history?.totalAttempts ?? 1}
          onRestart={handleRestart}
          scoreHistory={history?.scores.slice(-10).map((s) => s.score)}
          scoreSortOrder={config.scoreSortOrder}
          onClearHistory={handleClearHistory}
          testName={config.name}
        />
      )}
    </div>
  );
}
