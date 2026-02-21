"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";

const TOTAL_ROUNDS = 5;

function playBeat(audioCtx: AudioContext, time: number) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 600;
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.08);
}

function generatePattern(length: number): number[] {
  // Returns relative timestamps in ms from the first beat
  const pattern = [0];
  let t = 0;
  for (let i = 1; i < length; i++) {
    // Random interval: 200-600ms
    const interval = 200 + Math.floor(Math.random() * 4) * 100;
    t += interval;
    pattern.push(t);
  }
  return pattern;
}

function scoreAccuracy(reference: number[], taps: number[]): number {
  if (taps.length < 2 || reference.length < 2) return 0;

  // Normalize both to start at 0
  const refNorm = reference.map((t) => t - reference[0]);
  const tapNorm = taps.map((t) => t - taps[0]);

  // Compare intervals
  const refIntervals: number[] = [];
  const tapIntervals: number[] = [];
  for (let i = 1; i < refNorm.length; i++) {
    refIntervals.push(refNorm[i] - refNorm[i - 1]);
  }
  for (let i = 1; i < Math.min(tapNorm.length, refNorm.length); i++) {
    tapIntervals.push(tapNorm[i] - tapNorm[i - 1]);
  }

  if (tapIntervals.length === 0) return 0;

  const errors = tapIntervals.map((tap, i) => {
    if (i >= refIntervals.length) return 100;
    return Math.abs(tap - refIntervals[i]) / refIntervals[i] * 100;
  });

  const avgError = mean(errors);
  return Math.max(0, Math.round(100 - avgError));
}

function RhythmReplicationGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"listen" | "tap" | "result">("listen");
  const [pattern, setPattern] = useState<number[]>(() => generatePattern(4));
  const [taps, setTaps] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [tapPulse, setTapPulse] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const beatCount = 4 + round; // Increases each round

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playPattern = useCallback(() => {
    const ctx = getAudioCtx();
    const newPattern = generatePattern(beatCount);
    setPattern(newPattern);
    setPhase("listen");

    const now = ctx.currentTime + 0.2;
    newPattern.forEach((t) => {
      playBeat(ctx, now + t / 1000);
    });

    const totalDuration = newPattern[newPattern.length - 1] + 500;
    setTimeout(() => {
      setPhase("tap");
      setTaps([]);
    }, totalDuration);
  }, [getAudioCtx, beatCount]);

  // Auto-play pattern when round advances (round > 0)
  useEffect(() => {
    if (round > 0) {
      playPattern();
    }
  }, [round, playPattern]);

  const handleTap = useCallback(() => {
    if (phase !== "tap") return;

    const ctx = getAudioCtx();
    playBeat(ctx, ctx.currentTime);
    setTapPulse(true);
    setTimeout(() => setTapPulse(false), 100);

    const now = performance.now();
    const newTaps = [...taps, now];
    setTaps(newTaps);

    if (newTaps.length >= pattern.length) {
      const accuracy = scoreAccuracy(pattern, newTaps);
      setCurrentAccuracy(accuracy);
      const newScores = [...scores, accuracy];
      setScores(newScores);
      setPhase("result");

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= TOTAL_ROUNDS) {
          const avgAccuracy = Math.round(mean(newScores));
          onComplete(avgAccuracy, { perRound: newScores });
          return;
        }
        setRound(nextRound);
      }, 1500);
    }
  }, [phase, taps, pattern, scores, round, onComplete, getAudioCtx, playPattern]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm text-muted">Round</p>
          <p className="text-2xl font-bold font-mono">{round + 1}/{TOTAL_ROUNDS}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Beats</p>
          <p className="text-2xl font-bold font-mono">{beatCount}</p>
        </div>
      </div>

      {phase === "listen" && round === 0 && taps.length === 0 && (
        <button
          onClick={playPattern}
          className="rounded-lg bg-accent px-8 py-4 text-lg font-semibold text-white hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Play Rhythm
        </button>
      )}

      {phase === "listen" && (round > 0 || taps.length > 0) && (
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-warning/20 animate-pulse flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-warning" />
          </div>
          <p className="mt-4 text-muted">Listen to the rhythm...</p>
        </div>
      )}

      {phase === "tap" && (
        <div className="text-center space-y-4">
          <p className="text-muted">Tap it back! ({taps.length}/{pattern.length})</p>
          <button
            onClick={handleTap}
            className={`w-40 h-40 rounded-full font-semibold text-xl text-white transition-all cursor-pointer ${
              tapPulse ? "bg-warning scale-95" : "bg-warning/70 hover:bg-warning"
            }`}
          >
            TAP
          </button>
        </div>
      )}

      {phase === "result" && (
        <div className="text-center">
          <p className="text-sm text-muted">Accuracy</p>
          <p className={`text-4xl font-bold font-mono ${currentAccuracy >= 80 ? "text-success" : currentAccuracy >= 50 ? "text-warning" : "text-error"}`}>
            {currentAccuracy}%
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function RhythmReplicationPage() {
  const config = testMap["rhythm-replication"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          Listen to a rhythm pattern, then tap it back as accurately as you can.
          The patterns get longer each round. Make sure your sound is on.
        </p>
      }
    >
      {({ onComplete }) => <RhythmReplicationGame onComplete={onComplete} />}
    </TestShell>
  );
}
