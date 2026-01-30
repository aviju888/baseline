"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { motion } from "framer-motion";

const CANVAS_SIZE = 400;

interface Point {
  x: number;
  y: number;
}

function generatePath(complexity: number): Point[] {
  const points: Point[] = [];
  const center = CANVAS_SIZE / 2;
  const radius = 120;
  const numPoints = 6 + complexity * 2;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const r = radius + Math.sin(angle * (2 + complexity)) * (20 + complexity * 10);
    points.push({
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    });
  }
  return points;
}

function MirrorDrawingGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [level, setLevel] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [done, setDone] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [path] = useState<Point[]>(() => generatePath(1));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnPointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);

  // Draw the reference path
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw reference path
    ctx.strokeStyle = "#4f8fff44";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    path.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Draw thin center line
    ctx.strokeStyle = "#4f8fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    path.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Draw start indicator
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(path[0].x, path[0].y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw end indicator
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 8, 0, Math.PI * 2);
    ctx.fill();
  }, [path]);

  const getMirroredPos = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      const rawX = (clientX - rect.left) * scaleX;
      const rawY = (clientY - rect.top) * scaleY;

      // Mirror: invert both axes relative to center
      const mirrorX = CANVAS_SIZE - rawX;
      const mirrorY = CANVAS_SIZE - rawY;
      return { x: mirrorX, y: mirrorY };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (done) return;
      isDrawingRef.current = true;
      setDrawing(true);
      drawnPointsRef.current = [getMirroredPos(e.clientX, e.clientY)];
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [done, getMirroredPos]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current) return;
      const point = getMirroredPos(e.clientX, e.clientY);
      drawnPointsRef.current.push(point);

      // Draw the user's line
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const points = drawnPointsRef.current;
      if (points.length < 2) return;

      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const prev = points[points.length - 2];
      const curr = points[points.length - 1];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    },
    [getMirroredPos]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setDrawing(false);
    setDone(true);

    // Calculate accuracy
    const drawn = drawnPointsRef.current;
    if (drawn.length < 2) {
      setAccuracy(0);
      return;
    }

    // Sample points along the reference path and find closest drawn point
    let totalDist = 0;
    let samples = 0;
    const pathThreshold = 20; // pixels

    for (const refPoint of path) {
      let minDist = Infinity;
      for (const drawnPoint of drawn) {
        const d = Math.sqrt(
          (refPoint.x - drawnPoint.x) ** 2 + (refPoint.y - drawnPoint.y) ** 2
        );
        if (d < minDist) minDist = d;
      }
      totalDist += Math.min(minDist, pathThreshold * 2);
      samples++;
    }

    const avgDist = totalDist / samples;
    const acc = Math.max(0, Math.round((1 - avgDist / (pathThreshold * 2)) * 100));
    setAccuracy(acc);

    onComplete(acc, { level });
  }, [path, level, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm text-muted">Controls</p>
          <p className="font-mono font-bold text-warning">Inverted</p>
        </div>
        {done && (
          <div>
            <p className="text-sm text-muted">Accuracy</p>
            <p className={`font-mono font-bold ${accuracy >= 70 ? "text-success" : accuracy >= 40 ? "text-warning" : "text-error"}`}>
              {accuracy}%
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-md aspect-square rounded-xl border border-border bg-surface overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      <p className="text-sm text-muted max-w-md text-center">
        {!drawing && !done && (
          <>Trace the path from <span className="text-success">green</span> to <span className="text-error">red</span>. Your cursor moves in the <strong>opposite direction</strong>.</>
        )}
        {drawing && "Keep drawing..."}
        {done && `Accuracy: ${accuracy}%`}
      </p>
    </motion.div>
  );
}

export default function MirrorDrawingPage() {
  const config = testMap["mirror-drawing"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          Trace the highlighted path from the green dot to the red dot. The catch: your
          cursor movement is <strong>inverted</strong> - moving left makes it go right,
          and moving up makes it go down.
        </p>
      }
    >
      {({ onComplete }) => <MirrorDrawingGame onComplete={onComplete} />}
    </TestShell>
  );
}
