import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Server-side Supabase client for use in Server Components, Server
 * Actions and Route Handlers. Reads/writes the auth session via cookies,
 * still scoped to the anon key + Row Level Security (this is what powers
 * the admin login session, not a service-role bypass).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component during render — safe to ignore
          // because middleware.ts already refreshes the session on every
          // request. See https://supabase.com/docs/guides/auth/server-side/nextjs
        }
      },
    },
  });
}
