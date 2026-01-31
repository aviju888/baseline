"use client";

import { DifficultyLevel } from "@/types/scores";
import { DifficultyPreset, GameSettings } from "@/lib/tests/difficulty";
import { cn } from "@/lib/utils";

interface DifficultySelectorProps {
  presets: DifficultyPreset<GameSettings>[];
  selected: DifficultyLevel;
  onChange: (level: DifficultyLevel) => void;
}

export function DifficultySelector({ presets, selected, onChange }: DifficultySelectorProps) {
  const selectedPreset = presets.find((p) => p.level === selected);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted">Difficulty</p>
      <div className="flex gap-2">
        {presets.map((preset) => (
          <button
            key={preset.level}
            onClick={() => onChange(preset.level)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer",
              selected === preset.level
                ? "bg-accent text-background"
                : "bg-surface-light text-muted hover:text-foreground hover:bg-border-light"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {selectedPreset && (
        <p className="text-xs text-muted">{selectedPreset.description}</p>
      )}
    </div>
  );
}
