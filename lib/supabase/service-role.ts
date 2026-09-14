import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only Supabase client using the service role key. Bypasses RLS —
 * only use it for trusted, privileged server-side operations that
 * genuinely need to act outside a specific user's access (none exist yet
 * as of PR #2; everything so far runs through the RLS-respecting client in
 * lib/supabase/server.ts).
 *
 * The `server-only` import makes this module fail the build if it is ever
 * pulled into a client bundle, so the service role key can never reach the
 * browser. Returns `null` when Supabase has not been configured yet.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
