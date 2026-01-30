import type { CategoryConfig, CategoryId } from "@/types/tests";

export const categories: CategoryConfig[] = [
  {
    id: "classic",
    name: "Classic",
    description: "The fundamentals",
    color: "text-accent",
  },
  {
    id: "cognitive",
    name: "Cognitive",
    description: "Think fast",
    color: "text-violet",
  },
  {
    id: "perception",
    name: "Perception",
    description: "See clearly",
    color: "text-success",
  },
  {
    id: "audio-rhythm",
    name: "Audio & Rhythm",
    description: "Listen closely",
    color: "text-warning",
  },
  {
    id: "spatial-physics",
    name: "Spatial & Physics",
    description: "Think in 3D",
    color: "text-error",
  },
];

export const categoryMap = Object.fromEntries(
  categories.map((c) => [c.id, c])
) as Record<CategoryId, CategoryConfig>;
