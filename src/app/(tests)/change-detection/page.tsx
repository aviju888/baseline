"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { motion } from "framer-motion";

interface Shape {
  type: "circle" | "square" | "triangle";
  x: number;
  y: number;
  size: number;
  color: string;
}

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316"];
const SHAPE_TYPES: Shape["type"][] = ["circle", "square", "triangle"];
const TOTAL_ROUNDS = 10;
const CANVAS_W = 800;
const CANVAS_H = 500;
const FLASH_DURATION = 1200;
const GAP_DURATION = 300;

function generateScene(shapeCount: number): Shape[] {
  const padding = 50;
  return Array.from({ length: shapeCount }, () => ({
    type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
    x: padding + Math.random() * (CANVAS_W - padding * 2),
    y: padding + Math.random() * (CANVAS_H - padding * 2),
    size: 25 + Math.random() * 40,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
}

function modifyScene(shapes: Shape[]): { modified: Shape[]; changedIndex: number } {
  const idx = Math.floor(Math.random() * shapes.length);
  const modified = shapes.map((s, i) => {
    if (i !== idx) return { ...s };
    const change = Math.floor(Math.random() * 3);
    if (change === 0) {
      // Change color
      let newColor: string;
      do {
        newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      } while (newColor === s.color);
      return { ...s, color: newColor };
    } else if (change === 1) {
      // Change position
      return { ...s, x: s.x + (Math.random() > 0.5 ? 70 : -70), y: s.y + (Math.random() > 0.5 ? 50 : -50) };
    } else {
      // Change shape type
      let newType: Shape["type"];
      do {
        newType = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
      } while (newType === s.type);
      return { ...s, type: newType };
    }
  });
  return { modified, changedIndex: idx };
}

function drawScene(ctx: CanvasRenderingContext2D, shapes: Shape[]) {
  shapes.forEach((s) => {
    ctx.fillStyle = s.color;
    if (s.type === "circle") {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.type === "square") {
      ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    } else {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.size / 2);
      ctx.lineTo(s.x - s.size / 2, s.y + s.size / 2);
      ctx.lineTo(s.x + s.size / 2, s.y + s.size / 2);
      ctx.closePath();
      ctx.fill();
    }
  });
}

type CDPhase = "flash1" | "gap" | "flash2" | "waiting";

function ChangeDetectionGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<CDPhase>("flash1");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Shape[]>([]);
  const modifiedRef = useRef<Shape[]>([]);
  const changedIndexRef = useRef(0);

  const shapeCount = Math.min(5 + Math.floor(round / 2), 12);

  // Set up DPI-scaled canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const startRound = useCallback(() => {
    const scene = generateScene(shapeCount);
    const { modified, changedIndex } = modifyScene(scene);
    sceneRef.current = scene;
    modifiedRef.current = modified;
    changedIndexRef.current = changedIndex;

    // Flash 1
    setPhase("flash1");
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        drawScene(ctx, scene);
      }
    }

    setTimeout(() => {
      // Gap
      setPhase("gap");
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      }

      setTimeout(() => {
        // Flash 2
        setPhase("flash2");
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
            drawScene(ctx, modified);
          }
        }
      }, GAP_DURATION);
    }, FLASH_DURATION);
  }, [shapeCount]);

  useEffect(() => {
    startRound();
  }, [startRound]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase !== "flash2") return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Check if clicked near the changed shape
      const changedShape = modifiedRef.current[changedIndexRef.current];
      const dist = Math.sqrt((changedShape.x - x) ** 2 + (changedShape.y - y) ** 2);
      const isCorrect = dist < changedShape.size + 15;

      if (isCorrect) {
        setScore((s) => s + 1);
      }

      setFeedback(isCorrect ? "correct" : "wrong");

      // Highlight the correct answer
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = isCorrect ? "#22c55e" : "#ef4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(changedShape.x, changedShape.y, changedShape.size + 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      setTimeout(() => {
        setFeedback(null);
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          onComplete(isCorrect ? score + 1 : score, { total: TOTAL_ROUNDS });
          return;
        }
        setRound(nextRound);
        startRound();
      }, 1000);
    },
    [phase, round, score, onComplete, startRound]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm text-muted">Round</p>
          <p className="font-mono font-bold">{round + 1}/{TOTAL_ROUNDS}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Score</p>
          <p className="font-mono font-bold text-accent">{score}</p>
        </div>
      </div>

      <div className="w-full max-w-4xl aspect-[800/500] rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      <p className="text-sm text-muted">
        {phase === "flash1" && "Memorize the scene..."}
        {phase === "gap" && "..."}
        {phase === "flash2" && "Click what changed!"}
      </p>

      {feedback && (
        <p className={`text-sm font-medium ${feedback === "correct" ? "text-success" : "text-error"}`}>
          {feedback === "correct" ? "Correct!" : "Wrong!"}
        </p>
      )}
    </motion.div>
  );
}

export default function ChangeDetectionPage() {
  const config = testMap["change-detection"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          Two scenes will flash briefly with a gap between them. One shape changes between the
          two flashes. Click on what changed in the second scene.
        </p>
      }
    >
      {({ onComplete }) => <ChangeDetectionGame onComplete={onComplete} />}
    </TestShell>
  );
}
