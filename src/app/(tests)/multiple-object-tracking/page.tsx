"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { useCanvas } from "@/hooks/useCanvas";
import { motion } from "framer-motion";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTarget: boolean;
  selected: boolean;
  radius: number;
}

const BALL_RADIUS = 18;
const SPEED = 80;
const HIGHLIGHT_DURATION = 2000;
const TRACKING_DURATION = 5000;

type Phase = "highlight" | "tracking" | "select" | "result";

function createBalls(totalBalls: number, targetCount: number, w: number, h: number): Ball[] {
  const balls: Ball[] = [];
  for (let i = 0; i < totalBalls; i++) {
    const angle = Math.random() * Math.PI * 2;
    balls.push({
      x: BALL_RADIUS + Math.random() * (w - BALL_RADIUS * 2),
      y: BALL_RADIUS + Math.random() * (h - BALL_RADIUS * 2),
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      isTarget: i < targetCount,
      selected: false,
      radius: BALL_RADIUS,
    });
  }
  return balls;
}

function MOTGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>("highlight");
  const [lives, setLives] = useState(3);
  const [selectedCount, setSelectedCount] = useState(0);
  const ballsRef = useRef<Ball[]>([]);
  const phaseRef = useRef<Phase>("highlight");
  const containerRef = useRef<HTMLDivElement>(null);

  const targetCount = Math.min(2 + level, 6);
  const totalBalls = targetCount * 2 + 2;

  const initRound = useCallback(() => {
    const w = containerRef.current?.clientWidth ?? 600;
    const h = containerRef.current?.clientHeight ?? 400;
    ballsRef.current = createBalls(totalBalls, targetCount, w, h);
    setPhase("highlight");
    phaseRef.current = "highlight";
    setSelectedCount(0);

    setTimeout(() => {
      setPhase("tracking");
      phaseRef.current = "tracking";
      setTimeout(() => {
        setPhase("select");
        phaseRef.current = "select";
      }, TRACKING_DURATION);
    }, HIGHLIGHT_DURATION);
  }, [totalBalls, targetCount]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  const { canvasRef } = useCanvas({
    onDraw: (ctx, canvas, dt) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const currentPhase = phaseRef.current;
      const frameDt = Math.min(dt, 0.05); // Clamp to prevent huge jumps

      ballsRef.current.forEach((ball) => {
        if (currentPhase !== "select" && currentPhase !== "result") {
          // Move balls
          ball.x += ball.vx * frameDt;
          ball.y += ball.vy * frameDt;

          // Bounce off walls
          if (ball.x - ball.radius < 0 || ball.x + ball.radius > w) {
            ball.vx *= -1;
            ball.x = Math.max(ball.radius, Math.min(w - ball.radius, ball.x));
          }
          if (ball.y - ball.radius < 0 || ball.y + ball.radius > h) {
            ball.vy *= -1;
            ball.y = Math.max(ball.radius, Math.min(h - ball.radius, ball.y));
          }
        }

        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);

        if (currentPhase === "highlight" && ball.isTarget) {
          ctx.fillStyle = "#4f8fff";
        } else if (currentPhase === "result") {
          if (ball.isTarget && ball.selected) ctx.fillStyle = "#22c55e";
          else if (ball.isTarget && !ball.selected) ctx.fillStyle = "#ef4444";
          else if (ball.selected) ctx.fillStyle = "#f59e0b";
          else ctx.fillStyle = "#3a3a50";
        } else if (ball.selected) {
          ctx.fillStyle = "#4f8fff";
        } else {
          ctx.fillStyle = "#3a3a50";
        }
        ctx.fill();
      });
    },
    running: phase !== "result",
  });

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phaseRef.current !== "select") return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find clicked ball
      for (const ball of ballsRef.current) {
        const dist = Math.sqrt((ball.x - x) ** 2 + (ball.y - y) ** 2);
        if (dist <= ball.radius && !ball.selected) {
          ball.selected = true;
          const newCount = selectedCount + 1;
          setSelectedCount(newCount);

          if (newCount >= targetCount) {
            // Check results
            setPhase("result");
            phaseRef.current = "result";

            const correctSelections = ballsRef.current.filter(
              (b) => b.isTarget && b.selected
            ).length;

            setTimeout(() => {
              if (correctSelections === targetCount) {
                setLevel((l) => l + 1);
                initRound();
              } else {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                  onComplete(level, { maxLevel: level });
                } else {
                  initRound();
                }
              }
            }, 1500);
          }
          break;
        }
      }
    },
    [selectedCount, targetCount, canvasRef, level, lives, onComplete, initRound]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex gap-8 text-center">
        <div>
          <p className="text-sm text-muted">Level</p>
          <p className="text-2xl font-bold font-mono text-accent">{level}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Track</p>
          <p className="text-2xl font-bold font-mono">{targetCount} balls</p>
        </div>
        <div>
          <p className="text-sm text-muted">Lives</p>
          <p className="text-2xl font-bold font-mono text-error">{"♥".repeat(lives)}</p>
        </div>
      </div>

      <div ref={containerRef} className="w-full max-w-2xl aspect-[3/2] rounded-xl border border-border overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      <p className="text-sm text-muted">
        {phase === "highlight" && "Remember the blue balls..."}
        {phase === "tracking" && "Keep tracking them..."}
        {phase === "select" && `Click the ${targetCount} balls you were tracking (${selectedCount}/${targetCount})`}
        {phase === "result" && "Checking..."}
      </p>
    </motion.div>
  );
}

export default function MOTPage() {
  const config = testMap["multiple-object-tracking"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          Some balls will be highlighted blue. After they blend in and start moving, track them
          with your eyes. When they stop, click the ones that were originally highlighted.
        </p>
      }
    >
      {({ onComplete }) => <MOTGame onComplete={onComplete} />}
    </TestShell>
  );
}
