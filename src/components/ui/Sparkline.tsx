import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  sortOrder?: "asc" | "desc";
  className?: string;
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  sortOrder = "desc",
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Normalize data points to fit within height
  // For "asc" (lower is better), invert so improvement trends upward
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const normalizedY = (value - min) / range;
    const y = sortOrder === "asc"
      ? normalizedY * height  // Lower values at top (inverted)
      : (1 - normalizedY) * height;  // Higher values at top
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const lastPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
    >
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted"
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="2.5"
        className="fill-accent"
      />
    </svg>
  );
}
