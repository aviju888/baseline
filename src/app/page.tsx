"use client";

// TODO: Dashboard enhancements
// - Add QuickStats banner (tests completed today, streak, total attempts)
// - Add search/filter for tests
// - Add "recently played" section at the top
// - Add achievement badges (e.g. "Complete all classic tests", "Score in top 10%")
// - Add category filter tabs
// - Add animated gradient background or subtle particle effect for hero section

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { CategorySection } from "@/components/dashboard/CategorySection";
import { categories } from "@/lib/tests/categories";
import { getTestsByCategory } from "@/lib/tests/registry";
import { useStorage } from "@/providers/StorageProvider";
import { tests } from "@/lib/tests/registry";
import type { TestHistory } from "@/types/scores";
import type { TestId } from "@/types/tests";
import { motion } from "framer-motion";

export default function Home() {
  const storage = useStorage();
  const [history, setHistory] = useState<Partial<Record<string, TestHistory>>>({});

  useEffect(() => {
    const sortOrders = Object.fromEntries(
      tests.map((t) => [t.id, t.scoreSortOrder])
    ) as Record<TestId, "asc" | "desc">;
    storage.getAllHistory(sortOrders).then(setHistory);
  }, [storage]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl font-bold tracking-tight">baseline</h1>
          <p className="mt-3 text-lg text-muted">
            18 tests. How fast can you think?
          </p>
        </motion.div>

        <div className="space-y-12">
          {categories.map((category) => {
            const categoryTests = getTestsByCategory(category.id);
            return (
              <CategorySection
                key={category.id}
                category={category}
                tests={categoryTests}
                history={history}
              />
            );
          })}
        </div>
      </main>
    </>
  );
}
