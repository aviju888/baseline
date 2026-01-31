"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";

const TOTAL_ROUNDS = 15;
const CANVAS_SIZE = 300;

interface Block3D {
  x: number;
  y: number;
  z: number;
}

// Generate 3D L/T shaped pieces - like classic Tetris blocks but in 3D
function generateShape3D(): Block3D[] {
  const templates: Block3D[][] = [
    // L-shape
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 2, y: 1, z: 0 }],
    // T-shape
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }],
    // Z-shape
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }],
    // 3D L going up
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: 2 }],
    // Tower L
    [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 2 }, { x: 1, y: 0, z: 0 }],
    // Corner piece
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }],
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

// Rotate around Y axis (horizontal rotation)
function rotateY(shape: Block3D[], angle: number): Block3D[] {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  return shape.map((b) => ({
    x: b.x * cos + b.z * sin,
    y: b.y,
    z: -b.x * sin + b.z * cos,
  }));
}

// Rotate around X axis (tilt)
function rotateX(shape: Block3D[], angle: number): Block3D[] {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  return shape.map((b) => ({
    x: b.x,
    y: b.y * cos - b.z * sin,
    z: b.y * sin + b.z * cos,
  }));
}

// Mirror on X axis
function mirrorShape3D(shape: Block3D[]): Block3D[] {
  return shape.map((b) => ({ x: -b.x, y: b.y, z: b.z }));
}

// Convert 3D to isometric 2D coordinates
function toIsometric(x: number, y: number, z: number, cubeSize: number): { sx: number; sy: number } {
  const isoX = (x - z) * cubeSize * 0.866;
  const isoY = (x + z) * cubeSize * 0.5 - y * cubeSize;
  return { sx: isoX, sy: isoY };
}

// Draw isometric cube
function drawIsoCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number,
  cubeSize: number,
  baseColor: string,
  cx: number,
  cy: number
) {
  const { sx, sy } = toIsometric(x, y, z, cubeSize);
  const px = cx + sx;
  const py = cy + sy;

  const s = cubeSize;
  const h = s * 0.5;
  const w = s * 0.866;

  // Top face (lightest)
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(px, py - s);
  ctx.lineTo(px + w, py - h);
  ctx.lineTo(px, py);
  ctx.lineTo(px - w, py - h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#0a0a0f";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left face (medium)
  ctx.fillStyle = shadeColor(baseColor, -20);
  ctx.beginPath();
  ctx.moveTo(px - w, py - h);
  ctx.lineTo(px, py);
  ctx.lineTo(px, py + s);
  ctx.lineTo(px - w, py + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right face (darkest)
  ctx.fillStyle = shadeColor(baseColor, -40);
  ctx.beginPath();
  ctx.moveTo(px + w, py - h);
  ctx.lineTo(px + w, py + h);
  ctx.lineTo(px, py + s);
  ctx.lineTo(px, py);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function drawShape3D(ctx: CanvasRenderingContext2D, shape: Block3D[], cx: number, cy: number, color: string) {
  const cubeSize = 32;

  // Sort by depth for proper rendering (painter's algorithm)
  const sorted = [...shape].sort((a, b) => {
    const depthA = a.x + a.z - a.y;
    const depthB = b.x + b.z - b.y;
    return depthA - depthB;
  });

  sorted.forEach((b) => {
    drawIsoCube(ctx, b.x, b.y, b.z, cubeSize, color, cx, cy);
  });
}

interface Trial {
  leftShape: Block3D[];
  rightShape: Block3D[];
  isSame: boolean;
}

function generateTrial(): Trial {
  const base = generateShape3D();

  // Random rotation
  const rotations = [90, 180, 270];
  const yRot = rotations[Math.floor(Math.random() * rotations.length)];
  let rotated = rotateY(base, yRot);

  // Sometimes also rotate X
  if (Math.random() > 0.5) {
    const xRot = rotations[Math.floor(Math.random() * rotations.length)];
    rotated = rotateX(rotated, xRot);
  }

  const isSame = Math.random() > 0.5;

  return {
    leftShape: base,
    rightShape: isSame ? rotated : mirrorShape3D(rotated),
    isSame,
  };
}

function MentalRotationGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [trial, setTrial] = useState<Trial>(() => generateTrial());
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const trialStartRef = useRef(performance.now());

  useEffect(() => {
    const leftCanvas = leftCanvasRef.current;
    const rightCanvas = rightCanvasRef.current;
    if (!leftCanvas || !rightCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    [leftCanvas, rightCanvas].forEach((c) => {
      c.width = CANVAS_SIZE * dpr;
      c.height = CANVAS_SIZE * dpr;
    });

    const leftCtx = leftCanvas.getContext("2d");
    const rightCtx = rightCanvas.getContext("2d");
    if (!leftCtx || !rightCtx) return;

    leftCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rightCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear with dark background
    leftCtx.fillStyle = "#18181b";
    leftCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    rightCtx.fillStyle = "#18181b";
    rightCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawShape3D(leftCtx, trial.leftShape, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 30, "#3b82f6");
    drawShape3D(rightCtx, trial.rightShape, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 30, "#3b82f6");

    trialStartRef.current = performance.now();
  }, [trial]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        handleAnswer("same");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        handleAnswer("different");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleAnswer = useCallback(
    (answer: "same" | "different") => {
      if (feedback) return;
      const rt = performance.now() - trialStartRef.current;
      const isCorrect =
        (answer === "same" && trial.isSame) ||
        (answer === "different" && !trial.isSame);

      if (isCorrect) {
        setCorrect((c) => c + 1);
        setTimes((t) => [...t, rt]);
      }

      setFeedback(isCorrect ? "correct" : "wrong");

      setTimeout(() => {
        setFeedback(null);
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          const allTimes = isCorrect ? [...times, rt] : times;
          const avg = allTimes.length > 0 ? Math.round(mean(allTimes)) : 0;
          onComplete(avg, {
            correct: isCorrect ? correct + 1 : correct,
            total: TOTAL_ROUNDS,
          });
          return;
        }
        setRound(nextRound);
        setTrial(generateTrial());
      }, 400);
    },
    [trial, round, correct, times, onComplete, feedback]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="flex gap-8 text-center">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">Round</p>
          <p className="text-2xl font-mono font-bold">{round + 1}<span className="text-muted">/{TOTAL_ROUNDS}</span></p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">Correct</p>
          <p className="text-2xl font-mono font-bold text-success">{correct}</p>
        </div>
      </div>

      <p className="text-muted">Same shape, just rotated?</p>

      <div className="flex gap-4 sm:gap-8 items-center">
        <canvas
          ref={leftCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl border border-white/[0.06]"
        />
        <span className="text-2xl font-bold text-muted/40">vs</span>
        <canvas
          ref={rightCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-40 h-40 sm:w-56 sm:h-56 rounded-xl border border-white/[0.06]"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleAnswer("same")}
          disabled={feedback !== null}
          className="rounded-xl bg-accent/10 border border-accent/20 text-accent px-8 py-4 font-semibold hover:bg-accent/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <span className="block text-xs text-accent/60 mb-1">← A</span>
          Same
        </button>
        <button
          onClick={() => handleAnswer("different")}
          disabled={feedback !== null}
          className="rounded-xl bg-violet/10 border border-violet/20 text-violet px-8 py-4 font-semibold hover:bg-violet/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <span className="block text-xs text-violet/60 mb-1">D →</span>
          Different
        </button>
      </div>

      <div className="h-6">
        {feedback && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-medium ${feedback === "correct" ? "text-success" : "text-error"}`}
          >
            {feedback === "correct" ? "Correct!" : `Wrong! They were ${trial.isSame ? "the same" : "different"}`}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

export default function MentalRotationPage() {
  const config = testMap["mental-rotation"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          Two 3D shapes will appear. One may be rotated in space. Decide if they are the
          <strong> same shape</strong> (just rotated) or <strong>different</strong> (mirrored).
          Use A/D or arrow keys for quick responses.
        </p>
      }
    >
      {({ onComplete }) => <MentalRotationGame onComplete={onComplete} />}
    </TestShell>
  );
}
