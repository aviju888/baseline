"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { TestConfig } from "@/types/tests";
import { Sparkline } from "@/components/ui/Sparkline";

interface TestCardProps {
  test: TestConfig;
  bestScore?: string;
  recentScores?: number[];
  index: number;
}

// Icon colors by category — only icons stay colored
const iconColors: Record<string, string> = {
  classic: "text-accent",
  cognitive: "text-violet",
  perception: "text-success",
  "audio-rhythm": "text-warning",
  "spatial-physics": "text-error",
};

export function TestCard({ test, bestScore, recentScores, index }: TestCardProps) {
  const Icon = test.icon;
  const iconColor = iconColors[test.category] ?? "text-accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link href={test.route} className="group block">
        <div className="rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-border-light group-hover:translate-y-[-2px]">
          <div className="flex items-start gap-4">
            <Icon className={`h-7 w-7 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">{test.name}</h3>
              <p className="mt-1 text-sm text-muted line-clamp-2">{test.description}</p>
            </div>
          </div>

          {bestScore && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted">
                Best: <span className="font-mono font-medium text-foreground">{bestScore}</span>
              </p>
              {recentScores && recentScores.length > 1 && (
                <Sparkline
                  data={recentScores}
                  width={60}
                  height={20}
                  sortOrder={test.scoreSortOrder}
                />
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
