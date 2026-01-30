import type { TestId } from "@/types/tests";
import type { ScoreEntry, TestHistory } from "@/types/scores";

// TODO: Supabase integration
// - Create SupabaseStorageService implementing this interface
// - Add Supabase client setup (lib/supabase.ts)
// - Create scores table: id, user_id, test_id, score, unit, timestamp, duration, metadata (jsonb)
// - Create users table for profiles
// - Add RLS policies so users can only read/write their own scores

// TODO: Leaderboards
// - Add getGlobalLeaderboard(testId, limit): Promise<LeaderboardEntry[]>
// - Add getUserPercentile(testId, score, sortOrder): Promise<number>
// - Add getGlobalStats(testId): Promise<{ median, p25, p75, totalAttempts }>

export interface StorageService {
  saveScore(entry: ScoreEntry): Promise<void>;
  getScores(testId: TestId): Promise<ScoreEntry[]>;
  getBestScore(testId: TestId, sortOrder: "asc" | "desc"): Promise<number | null>;
  getRecentScores(testId: TestId, limit: number): Promise<ScoreEntry[]>;
  getTestHistory(testId: TestId, sortOrder: "asc" | "desc"): Promise<TestHistory | null>;
  getAllHistory(sortOrders: Record<TestId, "asc" | "desc">): Promise<Partial<Record<TestId, TestHistory>>>;
  getTotalTestsTaken(): Promise<number>;
  clearTestScores(testId: TestId): Promise<void>;
  clearAll(): Promise<void>;
  exportData(): Promise<string>;
  // TODO: Add importData(data: string): Promise<void> for migrating localStorage -> Supabase
  // TODO: Add deleteScore(id: string): Promise<void>
}
