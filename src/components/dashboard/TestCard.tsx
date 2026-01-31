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

// Category colors for icons and titles
const categoryColors: Record<string, string> = {
  classic: "text-accent",
  cognitive: "text-violet",
  perception: "text-success",
  "audio-rhythm": "text-warning",
  "spatial-physics": "text-error",
};

export function TestCard({ test, bestScore, recentScores, index }: TestCardProps) {
  const Icon = test.icon;
  const categoryColor = categoryColors[test.category] ?? "text-accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: "easeOut" }}
    >
      <Link href={test.route} className="group block">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 transition-colors duration-150 hover:bg-white/[0.04]">
          <div className="flex items-start gap-4">
            <Icon className={`h-9 w-9 shrink-0 ${categoryColor}`} weight="light" />
            <div className="min-w-0 flex-1">
              <h3 className={`font-medium ${categoryColor}`}>{test.name}</h3>
              <p className="mt-1 text-sm text-muted line-clamp-2">{test.description}</p>
            </div>
          </div>

          {bestScore && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
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
