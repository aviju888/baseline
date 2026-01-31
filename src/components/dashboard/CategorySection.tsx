"use client";

import { TestCard } from "./TestCard";
import type { TestConfig, CategoryConfig } from "@/types/tests";
import { formatScore } from "@/lib/scoring/statistics";
import type { TestHistory } from "@/types/scores";

interface CategorySectionProps {
  category: CategoryConfig;
  tests: TestConfig[];
  history: Partial<Record<string, TestHistory>>;
}

export function CategorySection({ category, tests, history }: CategorySectionProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{category.name}</h2>
        <p className="text-sm text-muted">{category.description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {tests.map((test, i) => {
          const h = history[test.id];
          const bestStr = h
            ? formatScore(h.bestScore, test.scoreUnit)
            : undefined;
          const recentScores = h?.scores.slice(-10).map((s) => s.score);
          return (
            <TestCard
              key={test.id}
              test={test}
              bestScore={bestStr}
              recentScores={recentScores}
              index={i}
            />
          );
        })}
      </div>
    </section>
  );
}
