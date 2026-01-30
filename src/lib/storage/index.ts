import { LocalStorageService } from "./localStorage";
import type { StorageService } from "./types";

export type { StorageService };

// TODO: Supabase swap
// - Install @supabase/supabase-js
// - Create lib/storage/supabase.ts with SupabaseStorageService
// - Check if user is authenticated: return SupabaseStorageService, else LocalStorageService
// - Add one-time migration: on first login, read localStorage data and bulk-insert to Supabase
export function createStorageService(): StorageService {
  return new LocalStorageService();
}
