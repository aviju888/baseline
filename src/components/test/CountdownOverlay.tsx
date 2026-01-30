"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCountdown } from "@/hooks/useCountdown";
import { useEffect } from "react";

interface CountdownOverlayProps {
  onComplete: () => void;
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const { count, start } = useCountdown(3, onComplete);

  useEffect(() => {
    start();
  }, [start]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-8xl font-bold font-mono text-accent"
        >
          {count > 0 ? count : "Go!"}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
