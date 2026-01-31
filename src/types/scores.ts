import type { TestId } from "./tests";

// TODO: Leaderboard types
// - Add LeaderboardEntry { userId, username, score, rank, timestamp }
// - Add GlobalStats { median, p25, p75, totalAttempts, totalUsers }
// - Add UserRanking { testId, rank, percentile, totalPlayers }

// TODO: Add userId field to ScoreEntry once auth is added

export type DifficultyLevel = "easy" | "normal" | "hard";

export interface ScoreEntry {
  id: string;
  testId: TestId;
  score: number;
  unit: string;
  timestamp: number;
  duration: number;
  metadata: Record<string, unknown>;
  difficulty?: DifficultyLevel;
}

export interface TestHistory {
  testId: TestId;
  scores: ScoreEntry[];
  bestScore: number;
  averageScore: number;
  totalAttempts: number;
  lastPlayed: number;
}

export interface StorageData {
  version: number;
  profile: {
    createdAt: number;
    totalTestsTaken: number;
  };
  scores: Partial<Record<TestId, ScoreEntry[]>>;
}
