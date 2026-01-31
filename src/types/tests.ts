import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export type TestId =
  | "reaction-time"
  | "sequence-memory"
  | "aim-trainer"
  | "rhythm-replication"
  | "pitch-comparison"
  | "tempo-matching"
  | "mental-rotation"
  | "trajectory-prediction"
  | "mirror-drawing"
  | "color-differentiation"
  | "multiple-object-tracking"
  | "change-detection"
  | "peripheral-vision"
  | "mental-math"
  | "pattern-recognition"
  | "stroop-test"
  | "n-back"
  | "decision-speed";

export type CategoryId =
  | "classic"
  | "audio-rhythm"
  | "spatial-physics"
  | "perception"
  | "cognitive";

export type TestPhase = "instructions" | "countdown" | "active" | "results";

export interface CategoryConfig {
  id: CategoryId;
  name: string;
  description: string;
  color: string;
}

export interface TestConfig {
  id: TestId;
  name: string;
  description: string;
  category: CategoryId;
  icon: PhosphorIcon;
  route: string;
  scoreUnit: string;
  scoreLabel: string;
  scoreSortOrder: "asc" | "desc"; // asc = lower is better, desc = higher is better
}
