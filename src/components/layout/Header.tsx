"use client";

import Link from "next/link";
import { Activity, History } from "lucide-react";

// TODO: Auth UI
// - Add login/signup button (right side of header)
// - Show user avatar + dropdown when logged in (profile, settings, logout)
// - Add a /profile route for user settings

// TODO: Nav
// - Add a leaderboard link (Trophy icon) once global leaderboards exist
// - Add mobile hamburger menu for smaller screens
// - Highlight active route

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Activity className="h-5 w-5 text-accent transition-transform group-hover:scale-110" />
          <span className="text-xl tracking-tight font-[family-name:var(--font-display)]">Baseline</span>
        </Link>

        <nav className="flex items-center gap-1">
          {/* TODO: Add leaderboard link here */}
          <Link
            href="/history"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-foreground hover:bg-surface"
          >
            <History className="h-4 w-4" />
            History
          </Link>
          {/* TODO: Add auth button here (Login / avatar dropdown) */}
        </nav>
      </div>
    </header>
  );
}
