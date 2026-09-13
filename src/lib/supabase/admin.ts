import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * Server-only (the `server-only` import throws a build error if this is
 * ever pulled into a client bundle). Restrict use to trusted server code
 * that genuinely needs to cross RLS boundaries, e.g.:
 *   - the scheduled currency-rate refresh (writes currency_rates as a
 *     system job, not as a logged-in admin)
 *   - admin user management via the Supabase Auth Admin API
 *
 * Everything else — including the rest of the admin panel's CRUD screens
 * — should go through lib/supabase/server.ts so RLS policies stay the
 * single source of truth for who can read/write what.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
