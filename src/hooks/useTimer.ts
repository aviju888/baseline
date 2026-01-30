"use client";

import { useCallback, useRef } from "react";

export function useTimer() {
  const startTime = useRef<number>(0);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const elapsed = useCallback(() => {
    return performance.now() - startTime.current;
  }, []);

  const reset = useCallback(() => {
    startTime.current = 0;
  }, []);

  return { start, elapsed, reset };
}
