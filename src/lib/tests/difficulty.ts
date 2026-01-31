import type { TestId } from "@/types/tests";
import type { DifficultyLevel } from "@/types/scores";

export interface DifficultyPreset<T = Record<string, unknown>> {
  level: DifficultyLevel;
  label: string;
  description: string;
  settings: T;
}

export interface TestDifficultyConfig<T = Record<string, unknown>> {
  testId: TestId;
  presets: DifficultyPreset<T>[];
  defaultLevel: DifficultyLevel;
}

// Settings interfaces per test
export interface AimTrainerSettings {
  totalTargets: number;
  targetSize: number;
}

export interface SequenceMemorySettings {
  gridSize: number;
  initialLength: number;
  flashDuration: number;
  flashGap: number;
}

export interface NBackSettings {
  n: number;
  sequenceLength: number;
  displayTime: number;
}

export interface MentalMathSettings {
  duration: number;
  startingMaxNumber: number;
  includeMultiplication: boolean;
}

export interface StroopTestSettings {
  totalRounds: number;
  incongruentProbability: number;
}

export interface MOTSettings {
  startingLevel: number;
  ballSpeed: number;
  trackingDuration: number;
}

// Combined settings type
export type GameSettings =
  | AimTrainerSettings
  | SequenceMemorySettings
  | NBackSettings
  | MentalMathSettings
  | StroopTestSettings
  | MOTSettings;

export const difficultyConfigs: Partial<Record<TestId, TestDifficultyConfig<GameSettings>>> = {
  "aim-trainer": {
    testId: "aim-trainer",
    defaultLevel: "normal",
    presets: [
      {
        level: "easy",
        label: "Easy",
        description: "Larger targets, fewer clicks",
        settings: { totalTargets: 20, targetSize: 80 } as AimTrainerSettings,
      },
      {
        level: "normal",
        label: "Normal",
        description: "Standard challenge",
        settings: { totalTargets: 30, targetSize: 60 } as AimTrainerSettings,
      },
      {
        level: "hard",
        label: "Hard",
        description: "Smaller targets, more clicks",
        settings: { totalTargets: 40, targetSize: 45 } as AimTrainerSettings,
      },
    ],
  },
  "sequence-memory": {
    testId: "sequence-memory",
    defaultLevel: "normal",
    presets: [
      {
        level: "easy",
        label: "Easy",
        description: "Slower flashes, shorter start",
        settings: { gridSize: 3, initialLength: 2, flashDuration: 800, flashGap: 400 } as SequenceMemorySettings,
      },
      {
        level: "normal",
        label: "Normal",
        description: "Standard challenge",
        settings: { gridSize: 3, initialLength: 3, flashDuration: 600, flashGap: 300 } as SequenceMemorySettings,
      },
      {
        level: "hard",
        label: "Hard",
        description: "Bigger grid, faster, longer start",
        settings: { gridSize: 4, initialLength: 4, flashDuration: 400, flashGap: 200 } as SequenceMemorySettings,
      },
    ],
  },
  "n-back": {
    testId: "n-back",
    defaultLevel: "normal",
    presets: [
      {
        level: "easy",
        label: "Easy",
        description: "1-back, slower pace",
        settings: { n: 1, sequenceLength: 15, displayTime: 2500 } as NBackSettings,
      },
      {
        level: "normal",
        label: "Normal",
        description: "2-back, standard pace",
        settings: { n: 2, sequenceLength: 20, displayTime: 2000 } as NBackSettings,
      },
      {
        level: "hard",
        label: "Hard",
        description: "3-back, faster pace",
        settings: { n: 3, sequenceLength: 25, displayTime: 1500 } as NBackSettings,
      },
    ],
  },
  "mental-math": {
    testId: "mental-math",
    defaultLevel: "normal",
    presets: [
      {
        level: "easy",
        label: "Easy",
        description: "More time, simpler math",
        settings: { duration: 90_000, startingMaxNumber: 10, includeMultiplication: false } as MentalMathSettings,
      },
      {
        level: "normal",
        label: "Normal",
        description: "Standard challenge",
        settings: { duration: 60_000, startingMaxNumber: 15, includeMultiplication: true } as MentalMathSettings,
      },
      {
        level: "hard",
        label: "Hard",
        description: "Less time, harder numbers",
        settings: { duration: 45_000, startingMaxNumber: 25, includeMultiplication: true } as MentalMathSettings,
      },
    ],
  },
  "stroop-test": {
    testId: "stroop-test",
    defaultLevel: "normal",
    presets: [
      {
        level: "easy",
        label: "Easy",
        description: "Fewer rounds, more congruent",
        settings: { totalRounds: 15, incongruentProbability: 0.5 } as StroopTestSettings,
      },
      {
        level: "normal",
        label: "Normal",
        description: "Standard challenge",
        settings: { totalRounds: 20, incongruentProbability: 0.7 } as StroopTestSettings,
      },
      {
        level: "hard",
        label: "Hard",
        description: "More rounds, mostly incongruent",
        settings: { totalRounds: 25, incongruentProbability: 0.85 } as StroopTestSettings,
      },
    ],
  },
  "multiple-object-tracking": {
    testId: "multiple-object-tracking",
    defaultLevel: "normal",
    presets: [
      {
        level: "easy",
        label: "Easy",
        description: "Slower balls, shorter tracking",
        settings: { startingLevel: 1, ballSpeed: 60, trackingDuration: 4000 } as MOTSettings,
      },
      {
        level: "normal",
        label: "Normal",
        description: "Standard challenge",
        settings: { startingLevel: 1, ballSpeed: 80, trackingDuration: 5000 } as MOTSettings,
      },
      {
        level: "hard",
        label: "Hard",
        description: "Faster balls, longer tracking",
        settings: { startingLevel: 2, ballSpeed: 100, trackingDuration: 6000 } as MOTSettings,
      },
    ],
  },
};

export function getTestDifficulty(testId: TestId): TestDifficultyConfig<GameSettings> | undefined {
  return difficultyConfigs[testId];
}

export function hasDifficultyPresets(testId: TestId): boolean {
  return testId in difficultyConfigs;
}

export function getPresetSettings<T extends GameSettings>(
  testId: TestId,
  level: DifficultyLevel
): T | undefined {
  const config = difficultyConfigs[testId];
  if (!config) return undefined;
  const preset = config.presets.find((p) => p.level === level);
  return preset?.settings as T | undefined;
}
