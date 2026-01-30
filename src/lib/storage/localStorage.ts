import type { TestId } from "@/types/tests";
import type { ScoreEntry, TestHistory, StorageData } from "@/types/scores";
import type { StorageService } from "./types";

const STORAGE_KEY = "baseline_data";
const SCHEMA_VERSION = 1;

// TODO: Schema migrations
// - Add a migrations.ts file with version-based transforms
// - When reading data, check version and run migrations if needed
// - Example: v1->v2 might add a "difficulty" field to ScoreEntry

function getDefaultData(): StorageData {
  return {
    version: SCHEMA_VERSION,
    profile: {
      createdAt: Date.now(),
      totalTestsTaken: 0,
    },
    scores: {},
  };
}

function readData(): StorageData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    return JSON.parse(raw) as StorageData;
  } catch {
    return getDefaultData();
  }
}

function writeData(data: StorageData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function computeHistory(
  testId: TestId,
  scores: ScoreEntry[],
  sortOrder: "asc" | "desc"
): TestHistory {
  const values = scores.map((s) => s.score);
  const sum = values.reduce((a, b) => a + b, 0);
  const best =
    sortOrder === "asc"
      ? Math.min(...values)
      : Math.max(...values);
  return {
    testId,
    scores,
    bestScore: best,
    averageScore: Math.round(sum / values.length),
    totalAttempts: scores.length,
    lastPlayed: Math.max(...scores.map((s) => s.timestamp)),
  };
}

export class LocalStorageService implements StorageService {
  async saveScore(entry: ScoreEntry): Promise<void> {
    const data = readData();
    if (!data.scores[entry.testId]) {
      data.scores[entry.testId] = [];
    }
    data.scores[entry.testId]!.push(entry);
    data.profile.totalTestsTaken += 1;
    writeData(data);
  }

  async getScores(testId: TestId): Promise<ScoreEntry[]> {
    const data = readData();
    return data.scores[testId] ?? [];
  }

  async getBestScore(
    testId: TestId,
    sortOrder: "asc" | "desc"
  ): Promise<number | null> {
    const scores = await this.getScores(testId);
    if (scores.length === 0) return null;
    const values = scores.map((s) => s.score);
    return sortOrder === "asc" ? Math.min(...values) : Math.max(...values);
  }

  async getRecentScores(testId: TestId, limit: number): Promise<ScoreEntry[]> {
    const scores = await this.getScores(testId);
    return scores.slice(-limit);
  }

  async getTestHistory(
    testId: TestId,
    sortOrder: "asc" | "desc"
  ): Promise<TestHistory | null> {
    const scores = await this.getScores(testId);
    if (scores.length === 0) return null;
    return computeHistory(testId, scores, sortOrder);
  }

  async getAllHistory(
    sortOrders: Record<TestId, "asc" | "desc">
  ): Promise<Partial<Record<TestId, TestHistory>>> {
    const data = readData();
    const result: Partial<Record<TestId, TestHistory>> = {};
    for (const [testId, scores] of Object.entries(data.scores)) {
      if (scores && scores.length > 0) {
        const id = testId as TestId;
        result[id] = computeHistory(id, scores, sortOrders[id] ?? "desc");
      }
    }
    return result;
  }

  async getTotalTestsTaken(): Promise<number> {
    const data = readData();
    return data.profile.totalTestsTaken;
  }

  async clearTestScores(testId: TestId): Promise<void> {
    const data = readData();
    if (data.scores[testId]) {
      const count = data.scores[testId]!.length;
      data.profile.totalTestsTaken -= count;
      delete data.scores[testId];
      writeData(data);
    }
  }

  async clearAll(): Promise<void> {
    writeData(getDefaultData());
  }

  async exportData(): Promise<string> {
    const data = readData();
    return JSON.stringify(data, null, 2);
  }
}
