"use client";

import { useState, useCallback, useRef } from "react";
import { TestShell } from "@/components/test/TestShell";
import { testMap } from "@/lib/tests/registry";
import { motion } from "framer-motion";

const TOTAL_ROUNDS = 15;
const TONE_DURATION = 0.5;

function playTone(audioCtx: AudioContext, frequency: number, startTime: number, duration: number) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
  gain.gain.setValueAtTime(0.3, startTime + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function PitchComparisonGame({
  onComplete,
}: {
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lives, setLives] = useState(3);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const correctAnswerRef = useRef<"higher" | "lower">("higher");

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playRound = useCallback(() => {
    const ctx = getAudioCtx();
    setPlaying(true);
    setFeedback(null);

    const baseFreq = 200 + Math.random() * 400; // 200-600 Hz
    const delta = Math.max(5, 100 - level * 8); // Gets smaller with level
    const isHigher = Math.random() > 0.5;
    const secondFreq = isHigher ? baseFreq + delta : baseFreq - delta;
    correctAnswerRef.current = isHigher ? "higher" : "lower";

    const now = ctx.currentTime;
    playTone(ctx, baseFreq, now + 0.1, TONE_DURATION);
    playTone(ctx, secondFreq, now + 0.1 + TONE_DURATION + 0.3, TONE_DURATION);

    setTimeout(() => {
      setPlaying(false);
    }, (TONE_DURATION * 2 + 0.4) * 1000 + 100);
  }, [getAudioCtx, level]);

  const handleAnswer = useCallback(
    (answer: "higher" | "lower") => {
      if (playing) return;
      const isCorrect = answer === correctAnswerRef.current;

      const newLives = isCorrect ? lives : lives - 1;

      if (isCorrect) {
        setScore((s) => s + 1);
        setLevel((l) => l + 1);
      } else {
        setLives(newLives);
      }

      setFeedback(isCorrect ? "correct" : "wrong");

      setTimeout(() => {
        const nextRound = round + 1;
        if (!isCorrect && newLives <= 0) {
          onComplete(level, { correct: score + (isCorrect ? 1 : 0), total: nextRound });
          return;
        }
        if (nextRound >= TOTAL_ROUNDS) {
          onComplete(level, { correct: score + (isCorrect ? 1 : 0), total: TOTAL_ROUNDS });
          return;
        }
        setRound(nextRound);
        setFeedback(null);
        playRound();
      }, 800);
    },
    [playing, round, score, level, lives, onComplete, playRound]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm text-muted">Level</p>
          <p className="text-2xl font-bold font-mono text-accent">{level}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Lives</p>
          <p className="text-2xl font-bold font-mono text-error">{"♥".repeat(lives)}</p>
        </div>
      </div>

      {!playing && round === 0 && !feedback && (
        <button
          onClick={playRound}
          className="rounded-lg bg-accent px-8 py-4 text-lg font-semibold text-white hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Play Tones
        </button>
      )}

      {playing && (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-accent" />
          </div>
          <p className="mt-4 text-muted">Listening...</p>
        </div>
      )}

      {!playing && (round > 0 || feedback) && (
        <div className="text-center space-y-4">
          <p className="text-lg text-muted">Was the second tone higher or lower?</p>
          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer("higher")}
              disabled={playing || feedback !== null}
              className="rounded-lg bg-accent/20 text-accent px-8 py-4 text-lg font-semibold hover:bg-accent/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              Higher
            </button>
            <button
              onClick={() => handleAnswer("lower")}
              disabled={playing || feedback !== null}
              className="rounded-lg bg-violet/20 text-violet px-8 py-4 text-lg font-semibold hover:bg-violet/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              Lower
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p className={`text-sm font-medium ${feedback === "correct" ? "text-success" : "text-error"}`}>
          {feedback === "correct" ? "Correct!" : `Wrong! It was ${correctAnswerRef.current}`}
        </p>
      )}
    </motion.div>
  );
}

export default function PitchComparisonPage() {
  const config = testMap["pitch-comparison"];
  return (
    <TestShell
      config={config}
      instructions={
        <p>
          Two tones will play in sequence. Decide if the second tone was <strong>higher</strong> or{" "}
          <strong>lower</strong> than the first. The difference gets more subtle as you level up.
          Make sure your sound is on.
        </p>
      }
    >
      {({ onComplete }) => <PitchComparisonGame onComplete={onComplete} />}
    </TestShell>
  );
}
