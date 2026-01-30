"use client";

// TODO: Auth-aware storage
// - Listen for Supabase auth state changes
// - When user logs in: migrate localStorage data to Supabase, switch to SupabaseStorageService
// - When user logs out: switch back to LocalStorageService
// - Add loading state while determining auth status

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { createStorageService, type StorageService } from "@/lib/storage";

const StorageContext = createContext<StorageService | null>(null);

function isLocalStorageAvailable(): boolean {
  try {
    const key = "__baseline_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const storage = useMemo(() => createStorageService(), []);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      setShowWarning(true);
    }
  }, []);

  return (
    <StorageContext.Provider value={storage}>
      {showWarning && (
        <div className="fixed top-0 inset-x-0 z-50 bg-warning/90 px-4 py-2 text-center text-sm font-medium text-black">
          localStorage is unavailable. Your scores won&apos;t be saved.{" "}
          <button onClick={() => setShowWarning(false)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage(): StorageService {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within StorageProvider");
  return ctx;
}
