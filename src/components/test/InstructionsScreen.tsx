"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

interface InstructionsScreenProps {
  title: string;
  description: string;
  icon: PhosphorIcon;
  instructions?: React.ReactNode;
  onStart: () => void;
}

export function InstructionsScreen({
  title,
  description,
  icon: Icon,
  instructions,
  onStart,
}: InstructionsScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-8 text-center px-4"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10">
        <Icon className="h-10 w-10 text-accent" weight="light" />
      </div>

      <div className="space-y-3">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-lg text-muted max-w-md">{description}</p>
      </div>

      {instructions && (
        <div className="max-w-md text-sm text-muted leading-relaxed">
          {instructions}
        </div>
      )}

      <Button size="lg" onClick={onStart}>
        Start Test
      </Button>
    </motion.div>
  );
}
