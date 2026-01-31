"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Sparkline } from "@/components/ui/Sparkline";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatScore } from "@/lib/scoring/statistics";
import { shareResult } from "@/lib/share";
import { RotateCcw, Home, Trash2, Share2 } from "lucide-react";
import Link from "next/link";

function getScoreFormatter(unit: string): (n: number) => string {
  if (unit === "ms") return (n) => `${Math.round(n)} ms`;
  if (unit === "%") return (n) => `${Math.round(n)}%`;
  if (unit === "BPM") return (n) => `${n.toFixed(1)} BPM`;
  if (unit === "px") return (n) => `${Math.round(n)} px`;
  if (unit === "level") return (n) => `Level ${Math.round(n)}`;
  if (unit === "pts") return (n) => `${Math.round(n)} pts`;
  return (n) => `${Math.round(n)} ${unit}`;
}

interface ResultsScreenProps {
  score: number;
  scoreUnit: string;
  scoreLabel: string;
  bestScore: number | null;
  averageScore: number | null;
  attempts: number;
  onRestart: () => void;
  scoreHistory?: number[];
  scoreSortOrder?: "asc" | "desc";
  onClearHistory?: () => void;
  testName?: string;
}

export function ResultsScreen({
  score,
  scoreUnit,
  scoreLabel,
  bestScore,
  averageScore,
  attempts,
  onRestart,
  scoreHistory,
  scoreSortOrder = "desc",
  onClearHistory,
  testName,
}: ResultsScreenProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClearConfirm = () => {
    onClearHistory?.();
    setShowClearDialog(false);
  };

  const handleShare = async () => {
    if (!testName) return;
    const success = await shareResult({
      testName,
      score: formatScore(score, scoreUnit),
      bestScore: bestScore !== null ? formatScore(bestScore, scoreUnit) : undefined,
    });
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-8 text-center px-4"
    >
      <div className="space-y-2">
        <p className="text-sm text-muted uppercase tracking-wider">{scoreLabel}</p>
        <div className="text-6xl font-bold font-mono text-accent">
          <AnimatedNumber
            value={score}
            duration={800}
            formatFn={getScoreFormatter(scoreUnit)}
          />
        </div>
      </div>

      <div className="flex gap-8 text-sm">
        {bestScore !== null && (
          <div className="space-y-1">
            <p className="text-muted">Best</p>
            <p className="font-mono font-medium">{formatScore(bestScore, scoreUnit)}</p>
          </div>
        )}
        {averageScore !== null && (
          <div className="space-y-1">
            <p className="text-muted">Average</p>
            <p className="font-mono font-medium">{formatScore(averageScore, scoreUnit)}</p>
          </div>
        )}
        <div className="space-y-1">
          <p className="text-muted">Attempts</p>
          <p className="font-mono font-medium">{attempts}</p>
        </div>
      </div>

      {scoreHistory && scoreHistory.length > 1 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted">Recent trend</p>
          <Sparkline
            data={scoreHistory}
            width={120}
            height={40}
            sortOrder={scoreSortOrder}
          />
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onRestart} variant="primary" size="lg">
          <RotateCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="secondary" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
        {testName && (
          <Button onClick={handleShare} variant="ghost" size="lg">
            <Share2 className="mr-2 h-4 w-4" />
            {copied ? "Copied!" : "Share"}
          </Button>
        )}
      </div>

      {onClearHistory && attempts > 0 && (
        <button
          onClick={() => setShowClearDialog(true)}
          className="text-xs text-muted hover:text-error transition-colors cursor-pointer flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Clear history
        </button>
      )}

      <ConfirmDialog
        open={showClearDialog}
        title="Clear History"
        message="This will delete all scores for this test. This action cannot be undone."
        confirmLabel="Clear"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearDialog(false)}
        destructive
      />
    </motion.div>
    </>
  );
}
