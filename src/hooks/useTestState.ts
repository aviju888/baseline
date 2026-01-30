"use client";

import { useState, useCallback } from "react";
import type { TestPhase } from "@/types/tests";

export function useTestState(initialPhase: TestPhase = "instructions") {
  const [phase, setPhase] = useState<TestPhase>(initialPhase);

  const startCountdown = useCallback(() => setPhase("countdown"), []);
  const startTest = useCallback(() => setPhase("active"), []);
  const finishTest = useCallback(() => setPhase("results"), []);
  const restart = useCallback(() => setPhase("instructions"), []);

  return {
    phase,
    setPhase,
    startCountdown,
    startTest,
    finishTest,
    restart,
  };
}
