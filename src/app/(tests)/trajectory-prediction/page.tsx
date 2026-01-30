"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";

const TOTAL_ROUNDS = 10;
const GRAVITY = 400;
const CANVAS_W = 600;
const CANVAS_H = 400;
const GROUND_Y = CANVAS_H - 30;
const BALL_RADIUS = 8;

interface Projectile {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  landingX: number;
  hideAfterPct: number;
}

function createProjectile(difficulty: number): Projectile {
  const x0 = 30 + Math.random() * 100;
  const y0 = GROUND_Y - 20 - Math.random() * 100;
  const angle = (30 + Math.random() * 40) * (Math.PI / 180);
  const speed = 200 + Math.random() * 200;
  const vx = Math.cos(angle) * speed;
  const vy = -Math.sin(angle) * speed;

  // Calculate landing x via quadratic formula
  // y0 + vy*t + 0.5*g*t^2 = GROUND_Y
  const a = 0.5 * GRAVITY;
  const b = vy;
  const c = y0 - GROUND_Y;
  const discriminant = b * b - 4 * a * c;
  const t = (-b + Math.sqrt(Math.max(0, discriminant))) / (2 * a);
  const landingX = x0 + vx * t;

  // Hide ball earlier with higher difficulty
  const hideAfterPct = Math.max(0.2, 0.6 - difficulty * 0.04);

  return { x0, y0, vx, vy, landingX, hideAfterPct };
}

function TrajectoryPredictionGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const [errors, setErrors] = useState<number[]>([]);
  const [phase, setPhase] = useState<"flying" | "click" | "result">("flying");
  const [clickX, setClickX] = useState<number | null>(null);
  const [lastError, setLastError] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projRef = useRef<Projectile>(createProjectile(0));
  const animRef = useRef(0);
  const startTimeRef = useRef(0);
  const phaseRef = useRef<"flying" | "click" | "result">("flying");

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const proj = projRef.current;
    const elapsed = (performance.now() - startTimeRef.current) / 1000;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw ground
    ctx.fillStyle = "#2a2a3e";
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // Calculate total flight time
    const a = 0.5 * GRAVITY;
    const b = proj.vy;
    const c = proj.y0 - GROUND_Y;
    const totalTime = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);

    const pct = elapsed / totalTime;

    if (pct < proj.hideAfterPct) {
      // Draw trail
      ctx.strokeStyle = "#4f8fff44";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const t = (elapsed * i) / steps;
        const x = proj.x0 + proj.vx * t;
        const y = proj.y0 + proj.vy * t + 0.5 * GRAVITY * t * t;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw ball
      const bx = proj.x0 + proj.vx * elapsed;
      const by = proj.y0 + proj.vy * elapsed + 0.5 * GRAVITY * elapsed * elapsed;
      ctx.fillStyle = "#4f8fff";
      ctx.beginPath();
      ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    if (pct >= proj.hideAfterPct && phaseRef.current === "flying") {
      phaseRef.current = "click";
      setPhase("click");
    }

    if (pct < 1 || phaseRef.current === "flying") {
      animRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const startRound = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const proj = createProjectile(round);
    projRef.current = proj;
    startTimeRef.current = performance.now();
    phaseRef.current = "flying";
    setPhase("flying");
    setClickX(null);
    setLastError(null);
    animRef.current = requestAnimationFrame(animate);
  }, [round, animate]);

  useEffect(() => {
    startRound();
    return () => cancelAnimationFrame(animRef.current);
  }, [startRound]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase !== "click") return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const x = (e.clientX - rect.left) * scaleX;

      const proj = projRef.current;
      const error = Math.abs(x - proj.landingX);
      setClickX(x);
      setLastError(Math.round(error));
      phaseRef.current = "result";
      setPhase("result");

      // Draw result
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw actual landing point
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(proj.landingX, GROUND_Y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw user's click
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(x, GROUND_Y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw line between them
        ctx.strokeStyle = "#ffffff44";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(proj.landingX, GROUND_Y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const newErrors = [...errors, error];
      setErrors(newErrors);

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          const avgError = Math.round(mean(newErrors));
          onComplete(avgError, { errors: newErrors.map(Math.round) });
          return;
        }
        setRound(nextRound);
      }, 1500);
    },
    [phase, errors, round, onComplete]
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
        {lastError !== null && (
          <div>
            <p className="text-sm text-muted">Error</p>
            <p className={`font-mono font-bold ${lastError < 30 ? "text-success" : lastError < 60 ? "text-warning" : "text-error"}`}>
              {lastError}px
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-xl aspect-[600/400] rounded-xl border border-border bg-surface overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          className={`w-full h-full ${phase === "click" ? "cursor-crosshair" : "cursor-default"}`}
        />
      </div>

      <p className="text-sm text-muted">
        {phase === "flying" && "Watch the ball..."}
        {phase === "click" && "Click where it will land!"}
        {phase === "result" && (lastError !== null ? `${lastError}px off` : "")}
      </p>
    </motion.div>
  );
}

export default function TrajectoryPredictionPage() {
  const config = testMap["trajectory-prediction"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          A ball will fly across the screen with gravity. It will disappear partway through its
          arc. Click on the ground where you think it will land.
        </p>
      }
    >
      {({ onComplete }) => <TrajectoryPredictionGame onComplete={onComplete} />}
    </TestShell>
  );
}
