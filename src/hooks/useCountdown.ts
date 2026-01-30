"use client";

import { useState, useEffect, useCallback } from "react";

export function useCountdown(from: number, onComplete: () => void) {
  const [count, setCount] = useState(from);
  const [active, setActive] = useState(false);

  const start = useCallback(() => {
    setCount(from);
    setActive(true);
  }, [from]);

  useEffect(() => {
    if (!active) return;
    if (count <= 0) {
      setActive(false);
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [active, count, onComplete]);

  return { count, active, start };
}
