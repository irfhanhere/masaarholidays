"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Browser-side Supabase client. Uses the public URL + anon key only —
 * every table this client can read/write is governed by the Row Level
 * Security policies in supabase/migrations/0001_init.sql.
 */
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
