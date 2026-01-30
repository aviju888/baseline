"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { mean } from "@/lib/scoring/statistics";
import { motion } from "framer-motion";

const TEMPOS = [70, 90, 110, 130, 160];
const TAPS_REQUIRED = 8;
const LISTEN_BEATS = 8;

function playClick(audioCtx: AudioContext, time: number) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 800;
  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.1);
}

function TempoMatchingGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [tempoIndex, setTempoIndex] = useState(0);
  const [phase, setPhase] = useState<"listen" | "tap" | "result">("listen");
  const [taps, setTaps] = useState<number[]>([]);
  const [results, setResults] = useState<number[]>([]);
  const [currentResult, setCurrentResult] = useState<number | null>(null);
  const [tapPulse, setTapPulse] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const targetBPM = TEMPOS[tempoIndex];

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playMetronome = useCallback(() => {
    const ctx = getAudioCtx();
    const interval = 60 / targetBPM;
    const now = ctx.currentTime + 0.1;

    for (let i = 0; i < LISTEN_BEATS; i++) {
      playClick(ctx, now + i * interval);
    }

    const totalDuration = (LISTEN_BEATS - 1) * interval + 0.5;
    setTimeout(() => {
      setPhase("tap");
      setTaps([]);
    }, totalDuration * 1000);
  }, [getAudioCtx, targetBPM]);

  useEffect(() => {
    playMetronome();
  }, [playMetronome]);

  const handleTap = useCallback(() => {
    if (phase !== "tap") return;

    const now = performance.now();
    setTapPulse(true);
    setTimeout(() => setTapPulse(false), 100);

    // Play a click feedback
    const ctx = getAudioCtx();
    playClick(ctx, ctx.currentTime);

    const newTaps = [...taps, now];
    setTaps(newTaps);

    if (newTaps.length >= TAPS_REQUIRED) {
      // Calculate BPM from tap intervals
      const intervals: number[] = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = mean(intervals);
      if (avgInterval <= 0 || !isFinite(avgInterval)) return;
      const tappedBPM = 60000 / avgInterval;
      const error = Math.abs(tappedBPM - targetBPM);

      setCurrentResult(Math.round(error * 10) / 10);
      const newResults = [...results, error];
      setResults(newResults);

      setPhase("result");

      setTimeout(() => {
        const nextIndex = tempoIndex + 1;
        if (nextIndex >= TEMPOS.length) {
          const avgError = Math.round(mean(newResults) * 10) / 10;
          onComplete(avgError, {
            tempos: TEMPOS,
            errors: newResults.map((e) => Math.round(e * 10) / 10),
          });
          return;
        }
        setTempoIndex(nextIndex);
        setPhase("listen");
        setCurrentResult(null);
      }, 1500);
    }
  }, [phase, taps, results, targetBPM, tempoIndex, onComplete, getAudioCtx]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm text-muted">Target</p>
          <p className="text-2xl font-bold font-mono">{targetBPM} BPM</p>
        </div>
        <div>
          <p className="text-sm text-muted">Round</p>
          <p className="text-2xl font-bold font-mono">{tempoIndex + 1}/{TEMPOS.length}</p>
        </div>
      </div>

      {phase === "listen" && (
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 animate-pulse flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-accent" />
          </div>
          <p className="mt-4 text-muted">Listen to the tempo...</p>
        </div>
      )}

      {phase === "tap" && (
        <div className="text-center space-y-4">
          <p className="text-muted">Tap the tempo ({taps.length}/{TAPS_REQUIRED})</p>
          <button
            onClick={handleTap}
            className={`w-40 h-40 rounded-full font-semibold text-xl text-white transition-all cursor-pointer ${
              tapPulse ? "bg-accent scale-95" : "bg-accent/70 hover:bg-accent"
            }`}
          >
            TAP
          </button>
        </div>
      )}

      {phase === "result" && currentResult !== null && (
        <div className="text-center">
          <p className="text-sm text-muted">Error</p>
          <p className={`text-3xl font-bold font-mono ${currentResult < 5 ? "text-success" : currentResult < 15 ? "text-warning" : "text-error"}`}>
            {currentResult} BPM off
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function TempoMatchingPage() {
  const config = testMap["tempo-matching"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          A metronome will play a tempo. After it stops, tap the big button to match that
          tempo as closely as you can. You&apos;ll be tested at 5 different speeds.
          Make sure your sound is on.
        </p>
      }
    >
      {({ onComplete }) => <TempoMatchingGame onComplete={onComplete} />}
    </TestShell>
  );
}
