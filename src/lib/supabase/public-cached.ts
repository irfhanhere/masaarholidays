import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./env";

/**
 * Public, read-only Supabase client for Server Components with Next.js ISR fetch caching.
 * Doesn't read cookies (so it doesn't opt routes into dynamic rendering) and caches
 * public responses with revalidate: 3600 (1 hour).
 */
export function createCachedPublicClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          next: { revalidate: 3600 },
        });
      },
    },
  });
}
