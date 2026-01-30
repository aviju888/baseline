import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
}

export function ProgressBar({ value, max = 100, className, color }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-2 w-full rounded-full bg-surface-light overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-300", color ?? "bg-accent")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
