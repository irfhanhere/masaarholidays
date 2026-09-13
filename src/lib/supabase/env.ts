/**
 * Central place that reads Supabase connection details from environment
 * variables. Nothing here is hardcoded — see .env.local.example for the
 * variables that must be set in .env.local (gitignored) or in your
 * hosting provider's environment settings.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.local.example to .env.local and fill in your Supabase project's values.`
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

export function getSupabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Server-only. Never import this file from a "use client" component. */
export function getSupabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * True once .env.local has real Supabase project values. Lets pages fall
 * back to an empty state (rather than throwing) before the project is
 * connected — e.g. on a fresh checkout of this scaffold.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
