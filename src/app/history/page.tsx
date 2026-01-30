"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { useStorage } from "@/providers/StorageProvider";
import { tests } from "@/lib/tests/registry";
import { categoryMap } from "@/lib/tests/categories";
import { formatScore } from "@/lib/scoring/statistics";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { TestHistory } from "@/types/scores";
import type { TestId } from "@/types/tests";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export default function HistoryPage() {
  const storage = useStorage();
  const [history, setHistory] = useState<Partial<Record<TestId, TestHistory>>>({});
  const [totalTests, setTotalTests] = useState(0);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  useEffect(() => {
    const sortOrders = Object.fromEntries(
      tests.map((t) => [t.id, t.scoreSortOrder])
    ) as Record<TestId, "asc" | "desc">;
    storage.getAllHistory(sortOrders).then(setHistory);
    storage.getTotalTestsTaken().then(setTotalTests);
  }, [storage]);

  const handleClearAll = async () => {
    await storage.clearAll();
    setHistory({});
    setTotalTests(0);
    setShowClearAllDialog(false);
  };

  const entries = tests.filter((t) => history[t.id]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">History</h1>
              <p className="text-muted">
                {totalTests} total tests taken across {entries.length} different tests.
              </p>
            </div>
            {entries.length > 0 && (
              <button
                onClick={() => setShowClearAllDialog(true)}
                className="text-sm text-muted hover:text-error transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted text-lg">No tests taken yet.</p>
              <Link
                href="/"
                className="mt-4 inline-block text-accent hover:text-accent-hover transition-colors"
              >
                Take your first test
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((test) => {
                const h = history[test.id]!;
                const category = categoryMap[test.category];
                const Icon = test.icon;
                return (
                  <Link key={test.id} href={test.route}>
                    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-border-light hover:bg-surface-light">
                      <Icon className="h-5 w-5 text-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{test.name}</p>
                        <p className="text-xs text-muted">{category.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-medium">
                          {formatScore(h.bestScore, test.scoreUnit)}
                        </p>
                        <p className="text-xs text-muted">
                          {h.totalAttempts} attempt{h.totalAttempts !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        <ConfirmDialog
          open={showClearAllDialog}
          title="Clear All Data"
          message="This will delete all your scores and history. This action cannot be undone."
          confirmLabel="Clear All"
          onConfirm={handleClearAll}
          onCancel={() => setShowClearAllDialog(false)}
          destructive
        />
      </main>
    </>
  );
}
