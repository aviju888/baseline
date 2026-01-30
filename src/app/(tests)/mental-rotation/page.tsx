"use client";

// TODO: Upgrade to 3D
// - Install @react-three/fiber, @react-three/drei, three
// - Replace 2D canvas blocks with 3D Shepard-Metzler shapes
// - Add interactive rotation controls (drag to rotate for exploration mode)
// - Add adjustable rotation angles for difficulty scaling

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";

const TOTAL_ROUNDS = 15;
const CANVAS_SIZE = 200;

interface Block {
  dx: number;
  dy: number;
}

// Generate an L/T/Z-shaped piece from connected blocks
function generateShape(): Block[] {
  const shape: Block[] = [{ dx: 0, dy: 0 }];
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (let i = 0; i < 3 + Math.floor(Math.random() * 2); i++) {
    const last = shape[shape.length - 1];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const next = { dx: last.dx + dir.dx, dy: last.dy + dir.dy };
    if (!shape.some((b) => b.dx === next.dx && b.dy === next.dy)) {
      shape.push(next);
    }
  }
  return shape;
}

function rotateShape(shape: Block[], angle: number): Block[] {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return shape.map((b) => ({
    dx: Math.round(b.dx * cos - b.dy * sin),
    dy: Math.round(b.dx * sin + b.dy * cos),
  }));
}

function mirrorShape(shape: Block[]): Block[] {
  return shape.map((b) => ({ dx: -b.dx, dy: b.dy }));
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Block[], cx: number, cy: number, color: string) {
  const blockSize = 28;
  const gap = 2;

  shape.forEach((b) => {
    const x = cx + b.dx * (blockSize + gap) - blockSize / 2;
    const y = cy + b.dy * (blockSize + gap) - blockSize / 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, blockSize, blockSize);
    ctx.strokeStyle = "#0a0a0f";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, blockSize, blockSize);
  });
}

interface Trial {
  leftShape: Block[];
  rightShape: Block[];
  isSame: boolean;
}

function generateTrial(difficulty: number): Trial {
  const base = generateShape();
  const angles = [90, 180, 270];
  const angle = angles[Math.floor(Math.random() * angles.length)];
  const rotated = rotateShape(base, angle);

  const isSame = Math.random() > 0.5;

  return {
    leftShape: base,
    rightShape: isSame ? rotated : mirrorShape(rotated),
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
  const [trial, setTrial] = useState<Trial>(() => generateTrial(0));
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const trialStartRef = useRef(performance.now());

  // Draw both shapes with DPI scaling
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

    leftCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    rightCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Dark background
    leftCtx.fillStyle = "#1a1a2e";
    leftCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    rightCtx.fillStyle = "#1a1a2e";
    rightCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawShape(leftCtx, trial.leftShape, CANVAS_SIZE / 2, CANVAS_SIZE / 2, "#4f8fff");
    drawShape(rightCtx, trial.rightShape, CANVAS_SIZE / 2, CANVAS_SIZE / 2, "#4f8fff");

    trialStartRef.current = performance.now();
  }, [trial]);

  const handleAnswer = useCallback(
    (answer: "same" | "different") => {
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
        setTrial(generateTrial(Math.floor(nextRound / 3)));
      }, 500);
    },
    [trial, round, correct, times, onComplete]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm text-muted">Round</p>
          <p className="font-mono font-bold">{round + 1}/{TOTAL_ROUNDS}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Correct</p>
          <p className="font-mono font-bold text-success">{correct}</p>
        </div>
      </div>

      <p className="text-sm text-muted">Are these the same shape (just rotated)?</p>

      <div className="flex gap-4 sm:gap-8 items-center">
        <canvas
          ref={leftCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl border border-border"
        />
        <span className="text-2xl font-bold text-muted">vs</span>
        <canvas
          ref={rightCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl border border-border"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleAnswer("same")}
          disabled={feedback !== null}
          className="rounded-lg bg-success/20 text-success px-8 py-3 font-semibold hover:bg-success/30 transition-colors cursor-pointer disabled:opacity-50"
        >
          Same
        </button>
        <button
          onClick={() => handleAnswer("different")}
          disabled={feedback !== null}
          className="rounded-lg bg-error/20 text-error px-8 py-3 font-semibold hover:bg-error/30 transition-colors cursor-pointer disabled:opacity-50"
        >
          Different
        </button>
      </div>

      {feedback && (
        <p className={`text-sm font-medium ${feedback === "correct" ? "text-success" : "text-error"}`}>
          {feedback === "correct" ? "Correct!" : `Wrong! They were ${trial.isSame ? "the same" : "different"}`}
        </p>
      )}
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
          Two shapes will appear side by side. One may be rotated. Decide if they are the
          <strong> same shape</strong> (just rotated) or <strong>different</strong> (mirrored).
        </p>
      }
    >
      {({ onComplete }) => <MentalRotationGame onComplete={onComplete} />}
    </TestShell>
  );
}
