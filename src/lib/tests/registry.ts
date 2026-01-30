// TODO: Test config enhancements
// - Add difficulty levels per test (easy/medium/hard) with different params
// - Add estimated duration per test (for dashboard display)
// - Add tags for filtering (e.g. "fast", "visual", "requires-audio")
// - Add SEO metadata per test (og:title, og:description, og:image)

// TODO: Additional tests to consider
// - Typing Speed test (WPM)
// - Verbal Memory (seen/new word identification)
// - Chimp Test (number position memory)
// - Visual Search (find target among distractors)
// - Dual N-Back (position + audio simultaneously)
// - Simon Says (color sequence memory)

import {
  Zap,
  Brain,
  Target,
  Music,
  Ear,
  Timer,
  RotateCcw,
  Rocket,
  FlipHorizontal,
  Palette,
  Eye,
  ScanSearch,
  CircleDot,
  Calculator,
  Puzzle,
  Type,
  Layers,
  Gauge,
} from "lucide-react";
import type { TestConfig, TestId } from "@/types/tests";

export const tests: TestConfig[] = [
  // Classic
  {
    id: "reaction-time",
    name: "Reaction Time",
    description: "Test how quickly you can respond to a visual stimulus.",
    category: "classic",
    icon: Zap,
    route: "/reaction-time",
    scoreUnit: "ms",
    scoreLabel: "Reaction Time",
    scoreSortOrder: "asc",
  },
  {
    id: "sequence-memory",
    name: "Sequence Memory",
    description: "Remember an increasingly long pattern of button presses.",
    category: "classic",
    icon: Brain,
    route: "/sequence-memory",
    scoreUnit: "level",
    scoreLabel: "Level",
    scoreSortOrder: "desc",
  },
  {
    id: "aim-trainer",
    name: "Aim Trainer",
    description: "Hit 30 targets as quickly as you can.",
    category: "classic",
    icon: Target,
    route: "/aim-trainer",
    scoreUnit: "ms",
    scoreLabel: "Avg. Time",
    scoreSortOrder: "asc",
  },

  // Cognitive
  {
    id: "mental-math",
    name: "Mental Math",
    description: "Solve arithmetic problems as fast as you can.",
    category: "cognitive",
    icon: Calculator,
    route: "/mental-math",
    scoreUnit: "pts",
    scoreLabel: "Score",
    scoreSortOrder: "desc",
  },
  {
    id: "stroop-test",
    name: "Stroop Test",
    description: "Name the color, not the word. Fight your instincts.",
    category: "cognitive",
    icon: Type,
    route: "/stroop-test",
    scoreUnit: "ms",
    scoreLabel: "Avg. Time",
    scoreSortOrder: "asc",
  },
  {
    id: "decision-speed",
    name: "Decision Speed",
    description: "Categorize items as fast as possible under pressure.",
    category: "cognitive",
    icon: Gauge,
    route: "/decision-speed",
    scoreUnit: "ms",
    scoreLabel: "Avg. Time",
    scoreSortOrder: "asc",
  },
  {
    id: "pattern-recognition",
    name: "Pattern Recognition",
    description: "Find the missing piece in each pattern sequence.",
    category: "cognitive",
    icon: Puzzle,
    route: "/pattern-recognition",
    scoreUnit: "pts",
    scoreLabel: "Score",
    scoreSortOrder: "desc",
  },
  {
    id: "n-back",
    name: "N-Back",
    description: "Was this the same stimulus from N steps ago?",
    category: "cognitive",
    icon: Layers,
    route: "/n-back",
    scoreUnit: "pts",
    scoreLabel: "Score",
    scoreSortOrder: "desc",
  },

  // Perception
  {
    id: "color-differentiation",
    name: "Color Differentiation",
    description: "Find the tile with the slightly different shade.",
    category: "perception",
    icon: Palette,
    route: "/color-differentiation",
    scoreUnit: "level",
    scoreLabel: "Level",
    scoreSortOrder: "desc",
  },
  {
    id: "multiple-object-tracking",
    name: "Object Tracking",
    description: "Track highlighted balls as they move among others.",
    category: "perception",
    icon: Eye,
    route: "/multiple-object-tracking",
    scoreUnit: "level",
    scoreLabel: "Level",
    scoreSortOrder: "desc",
  },
  {
    id: "change-detection",
    name: "Change Detection",
    description: "Spot what changed between two flashed scenes.",
    category: "perception",
    icon: ScanSearch,
    route: "/change-detection",
    scoreUnit: "pts",
    scoreLabel: "Score",
    scoreSortOrder: "desc",
  },
  {
    id: "peripheral-vision",
    name: "Peripheral Vision",
    description: "Detect motion in your peripheral vision while focused.",
    category: "perception",
    icon: CircleDot,
    route: "/peripheral-vision",
    scoreUnit: "pts",
    scoreLabel: "Score",
    scoreSortOrder: "desc",
  },

  // Audio & Rhythm
  {
    id: "rhythm-replication",
    name: "Rhythm Replication",
    description: "Listen to a beat pattern and tap it back.",
    category: "audio-rhythm",
    icon: Music,
    route: "/rhythm-replication",
    scoreUnit: "%",
    scoreLabel: "Accuracy",
    scoreSortOrder: "desc",
  },
  {
    id: "pitch-comparison",
    name: "Pitch Comparison",
    description: "Which tone is higher? Test your frequency discrimination.",
    category: "audio-rhythm",
    icon: Ear,
    route: "/pitch-comparison",
    scoreUnit: "level",
    scoreLabel: "Level",
    scoreSortOrder: "desc",
  },
  {
    id: "tempo-matching",
    name: "Tempo Matching",
    description: "Tap along to match the tempo of a metronome.",
    category: "audio-rhythm",
    icon: Timer,
    route: "/tempo-matching",
    scoreUnit: "BPM",
    scoreLabel: "Avg. Error",
    scoreSortOrder: "asc",
  },

  // Spatial & Physics
  {
    id: "mental-rotation",
    name: "Mental Rotation",
    description: "Are these two 3D shapes the same, just rotated?",
    category: "spatial-physics",
    icon: RotateCcw,
    route: "/mental-rotation",
    scoreUnit: "ms",
    scoreLabel: "Avg. Time",
    scoreSortOrder: "asc",
  },
  {
    id: "trajectory-prediction",
    name: "Trajectory Prediction",
    description: "Predict where the ball will land after it disappears.",
    category: "spatial-physics",
    icon: Rocket,
    route: "/trajectory-prediction",
    scoreUnit: "px",
    scoreLabel: "Avg. Error",
    scoreSortOrder: "asc",
  },
  {
    id: "mirror-drawing",
    name: "Mirror Drawing",
    description: "Trace a path with inverted controls.",
    category: "spatial-physics",
    icon: FlipHorizontal,
    route: "/mirror-drawing",
    scoreUnit: "%",
    scoreLabel: "Accuracy",
    scoreSortOrder: "desc",
  },
];

export const testMap = Object.fromEntries(
  tests.map((t) => [t.id, t])
) as Record<TestId, TestConfig>;

export function getTestsByCategory(categoryId: string): TestConfig[] {
  return tests.filter((t) => t.category === categoryId);
}
