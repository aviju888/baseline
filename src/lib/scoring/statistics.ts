// TODO: Normative data
// - Add percentile lookup tables per test (based on collected global data)
// - Add getPercentileLabel(percentile): "Elite" | "Great" | "Average" | etc.
// - Add scoring tiers with colors for the results screen

// TODO: Add d-prime calculation for signal detection tests (N-Back)
// - dPrime(hitRate, falseAlarmRate): number

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((v) => (v - avg) ** 2);
  return Math.sqrt(mean(squaredDiffs));
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function formatScore(score: number, unit: string): string {
  if (unit === "ms") return `${Math.round(score)} ms`;
  if (unit === "%") return `${Math.round(score)}%`;
  if (unit === "BPM") return `${score.toFixed(1)} BPM`;
  if (unit === "px") return `${Math.round(score)} px`;
  if (unit === "level") return `Level ${Math.round(score)}`;
  if (unit === "pts") return `${Math.round(score)} pts`;
  return `${score} ${unit}`;
}
